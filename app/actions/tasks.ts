"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { Task, TaskStatus, TaskPriority } from "@/types/tasks";

// Helper function to create a notification
async function createNotification(supabase: any, {
  userId,
  actorId,
  workspaceId,
  type,
  title,
  message = null,
  linkUrl = null
}: {
  userId: string;
  actorId: string | null;
  workspaceId: string | null;
  type: string;
  title: string;
  message?: string | null;
  linkUrl?: string | null;
}) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      workspace_id: workspaceId,
      type,
      title,
      message,
      link_url: linkUrl
    });
  } catch (err) {
    console.error("Failed to create notification", err);
  }
}

export async function getTasks(workspaceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    const assigneeIds = Array.from(new Set(data.map(t => t.assignee_id).filter(Boolean)));
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assigneeIds);
        
      if (profiles && profiles.length > 0) {
        const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.full_name]));
        for (const task of data) {
          if (task.assignee_id && profileMap[task.assignee_id]) {
            task.assignee_name = profileMap[task.assignee_id];
          }
        }
      }
    }
  }

  return data as Task[];
}

export async function createTask(workspaceId: string, data: Partial<Task>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload: any = {
    workspace_id: workspaceId,
    title: data.title,
    priority: data.priority || 'medium',
    status: data.status || 'pending',
    review_status: data.review_status || 'pending',
  };
  
  if (data.assignee_name !== undefined) payload.assignee_name = data.assignee_name || null;
  if (data.assignee_id !== undefined) payload.assignee_id = data.assignee_id || null;
  if (data.deadline !== undefined) payload.deadline = data.deadline || null;
  if (data.video_url !== undefined) payload.video_url = data.video_url || null;
  if (data.video_url_2 !== undefined) payload.video_url_2 = data.video_url_2 || null;
  if (data.product_url !== undefined) payload.product_url = data.product_url || null;

  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    throw new Error("Lỗi cơ sở dữ liệu: " + error.message);
  }

  revalidatePath("/tasks");
  return newTask as Task;
}

export async function updateTask(taskId: string, data: Partial<Task>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload: any = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) payload.title = data.title;
  if (data.assignee_name !== undefined) payload.assignee_name = data.assignee_name;
  if (data.assignee_id !== undefined) payload.assignee_id = data.assignee_id;
  if (data.deadline !== undefined) payload.deadline = data.deadline;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.status !== undefined) payload.status = data.status;
  if (data.video_url !== undefined) payload.video_url = data.video_url;
  if (data.video_url_2 !== undefined) payload.video_url_2 = data.video_url_2;
  if (data.product_url !== undefined) payload.product_url = data.product_url;
  if (data.review_status !== undefined) payload.review_status = data.review_status;

  // Lấy assignee cũ để check nếu thay đổi người được giao
  let oldAssigneeId = null;
  let workspaceId = null;
  if (data.assignee_id !== undefined) {
    const { data: oldTask } = await supabase.from("tasks").select("assignee_id, workspace_id, title").eq("id", taskId).single();
    if (oldTask) {
      oldAssigneeId = oldTask.assignee_id;
      workspaceId = oldTask.workspace_id;
      // Thông báo cho người mới được giao
      if (data.assignee_id && data.assignee_id !== oldAssigneeId && data.assignee_id !== user.id) {
        await createNotification(supabase, {
          userId: data.assignee_id,
          actorId: user.id,
          workspaceId: workspaceId,
          type: 'assign_task',
          title: `Bạn được giao công việc: ${data.title || oldTask.title}`,
          message: 'Hãy kiểm tra danh sách công việc của bạn.',
          linkUrl: '/tasks'
        });
      }
    }
  }

  const { data: updatedTask, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    throw new Error("Lỗi cơ sở dữ liệu: " + error.message);
  }

  revalidatePath("/tasks");
  return updatedTask as Task;
}

export async function claimTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current user's profile to get full_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
    
  const fullName = profile?.full_name || user.email?.split('@')[0] || "Unknown";

  const { error } = await supabase
    .from("tasks")
    .update({
      assignee_id: user.id,
      assignee_name: fullName,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error claiming task:", error);
    return { error: error.message };
  }

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task status:", error);
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting task:", error);
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  return { success: true };
}

export async function approveTaskAndPay(taskId: string, workspaceId: string, taskTitle: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Lấy assignee_id từ task
  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();
    
  if (taskError || !taskData?.assignee_id) {
    console.error("Error getting assignee_id:", taskError);
    return { error: "Không tìm thấy người làm nhiệm vụ này để cộng lương." };
  }
  
  const targetUserId = taskData.assignee_id;

  // 1. Cập nhật review_status thành 'approved'
  const { error: updateError } = await supabase
    .from("tasks")
    .update({ 
      review_status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (updateError) {
    console.error("Error approving task:", updateError);
    return { error: updateError.message };
  }

  // 2. Tính lương và lưu vào salary_records
  const RATE_BASE = 250000;      // 250k/clip
  const RATE_BONUS = 280000;     // 280k/clip từ clip thứ 6 trở đi
  const BONUS_THRESHOLD = 5;

  const now = new Date();
  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth() + 1;

  // Đếm số lượng clip hiện tại trong tháng của người làm (targetUserId)
  const { data: currentRecords } = await supabase
    .from("salary_records")
    .select("id")
    .eq("user_id", targetUserId)
    .eq("period_year", viewYear)
    .eq("period_month", viewMonth);

  const totalClips = currentRecords ? currentRecords.length : 0;
  const nextCount = totalClips + 1;
  const rate = totalClips >= BONUS_THRESHOLD ? RATE_BONUS : RATE_BASE;

  const { error: salaryError } = await supabase
    .from("salary_records")
    .insert({
      workspace_id: workspaceId,
      user_id: targetUserId,
      clip_title: `Sản phẩm hoàn thành từ: ${taskTitle}`,
      completed_at: now.toISOString(),
      period_year: viewYear,
      period_month: viewMonth,
      clip_count_in_month: nextCount,
      rate_per_clip: rate,
    });

  if (salaryError) {
    console.error("Error adding salary record:", salaryError);
    return { error: "Lỗi khi cộng lương: " + salaryError.message };
  }

  // Create notification
  await createNotification(supabase, {
    userId: targetUserId,
    actorId: user.id,
    workspaceId: workspaceId,
    type: 'review_approved',
    title: `Sản phẩm được duyệt: ${taskTitle}`,
    message: `Thưởng lương: ${rate.toLocaleString()}đ`,
    linkUrl: '/tasks'
  });

  revalidatePath("/tasks");
  revalidatePath("/my-salary");
  return { success: true, rate, nextCount };
}

export async function revokeTaskApprovalAndDeduct(taskId: string, taskTitle: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Lấy assignee_id từ task
  const { data: taskData, error: taskError } = await supabase
    .from("tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();
    
  if (taskError || !taskData?.assignee_id) {
    console.error("Error getting assignee_id:", taskError);
    return { error: "Không tìm thấy người làm nhiệm vụ này để thu hồi lương." };
  }
  
  const targetUserId = taskData.assignee_id;

  // 1. Cập nhật review_status thành 'rejected'
  const { error: updateError } = await supabase
    .from("tasks")
    .update({ 
      review_status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (updateError) {
    console.error("Error revoking task:", updateError);
    return { error: updateError.message };
  }

  // 2. Xóa record lương của người làm
  const { error: deleteError } = await supabase
    .from("salary_records")
    .delete()
    .eq("user_id", targetUserId)
    .eq("clip_title", `Sản phẩm hoàn thành từ: ${taskTitle}`);

  if (deleteError) {
    console.error("Error deleting salary record:", deleteError);
  }

  // Create notification
  await createNotification(supabase, {
    userId: targetUserId,
    actorId: user.id,
    workspaceId: null,
    type: 'review_rejected',
    title: `Sản phẩm bị TỪ CHỐI duyệt: ${taskTitle}`,
    message: `Lương tương ứng đã bị thu hồi.`,
    linkUrl: '/tasks'
  });

  revalidatePath("/tasks");
  revalidatePath("/my-salary");
  return { success: true };
}


export async function getTaskComments(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching task comments:", error);
    return [];
  }

  if (data && data.length > 0) {
    const userIds = Array.from(new Set(data.map(c => c.user_id).filter(Boolean)));
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
        
      if (profiles && profiles.length > 0) {
        const profileMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]));
        for (const comment of data) {
          if (comment.user_id && profileMap[comment.user_id]) {
            comment.user_name = profileMap[comment.user_id].full_name;
            comment.user_avatar = profileMap[comment.user_id].avatar_url;
          }
        }
      }
    }
  }

  return data;
}

export async function addTaskComment(taskId: string, content: string, imageUrl: string | null = null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get user profile to get full_name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
    
  const fullName = profile?.full_name || user.email?.split('@')[0] || "Unknown";

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: user.id,
      user_name: fullName,
      content,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding task comment:", error);
    throw new Error(error.message);
  }

  // Lấy thông tin task để gửi thông báo cho rõ ràng
  const { data: taskInfo } = await supabase
    .from("tasks")
    .select("title, assignee_id, workspace_id")
    .eq("id", taskId)
    .single();

  if (taskInfo && taskInfo.assignee_id && taskInfo.assignee_id !== user.id) {
    await createNotification(supabase, {
      userId: taskInfo.assignee_id,
      actorId: user.id,
      workspaceId: taskInfo.workspace_id,
      type: 'comment',
      title: `${fullName} đã nhận xét về: ${taskInfo.title}`,
      message: content,
      linkUrl: '/tasks'
    });
  }

  // Gửi thông báo Telegram nếu có cấu hình
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (botToken && chatId) {
    const taskTitle = taskInfo?.title || "Không rõ";
    const message = `💬 <b>Nhận xét mới từ ${fullName}</b>\n\n📌 <b>Sản phẩm:</b> ${taskTitle}\n📝 <b>Nội dung:</b> ${content}`;
    
    try {
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }).catch(err => console.error("Fetch telegram error:", err));
    } catch (err) {
      console.error("Error sending telegram notification:", err);
    }
  }

  return data;
}

export async function unclaimTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("tasks")
    .update({
      assignee_id: null,
      assignee_name: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error unclaiming task:", error);
    return { error: error.message };
  }

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTaskComment(commentId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("task_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting comment:", error);
    throw new Error(error.message);
  }

  return { success: true };
}
