"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { PhotoTask, PhotoTaskStatus, PhotoTaskPriority } from "@/types/photo_tasks";

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

export async function getPhotoTasks(workspaceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("photo_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Error fetching photo tasks:", error);
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

  return data as PhotoTask[];
}

export async function createPhotoTask(workspaceId: string, data: Partial<PhotoTask>) {
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
  
  if (data.description !== undefined) payload.description = data.description || null;
  if (data.assignee_name !== undefined) payload.assignee_name = data.assignee_name || null;
  if (data.assignee_id !== undefined) payload.assignee_id = data.assignee_id || null;
  if (data.deadline !== undefined) payload.deadline = data.deadline || null;
  if (data.video_url !== undefined) payload.video_url = data.video_url || null;
  if (data.video_url_2 !== undefined) payload.video_url_2 = data.video_url_2 || null;
  if (data.image_urls !== undefined) payload.image_urls = data.image_urls || [];
  if (data.product_url !== undefined) payload.product_url = data.product_url || null;

  const { data: newTask, error } = await supabase
    .from("photo_tasks")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating photo task:", error);
    throw new Error("Lỗi cơ sở dữ liệu: " + error.message);
  }

  revalidatePath("/photo-tasks");
  return newTask as PhotoTask;
}

export async function updatePhotoTask(taskId: string, data: Partial<PhotoTask>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload: any = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.assignee_name !== undefined) payload.assignee_name = data.assignee_name;
  if (data.assignee_id !== undefined) payload.assignee_id = data.assignee_id;
  if (data.deadline !== undefined) payload.deadline = data.deadline;
  if (data.priority !== undefined) payload.priority = data.priority;
  if (data.status !== undefined) payload.status = data.status;
  if (data.video_url !== undefined) payload.video_url = data.video_url;
  if (data.video_url_2 !== undefined) payload.video_url_2 = data.video_url_2;
  if (data.image_urls !== undefined) payload.image_urls = data.image_urls;
  if (data.product_url !== undefined) payload.product_url = data.product_url;
  if (data.review_status !== undefined) payload.review_status = data.review_status;

  let oldAssigneeId = null;
  let workspaceId = null;
  if (data.assignee_id !== undefined) {
    const { data: oldTask } = await supabase.from("photo_tasks").select("assignee_id, workspace_id, title").eq("id", taskId).single();
    if (oldTask) {
      oldAssigneeId = oldTask.assignee_id;
      workspaceId = oldTask.workspace_id;
      if (data.assignee_id && data.assignee_id !== oldAssigneeId && data.assignee_id !== user.id) {
        await createNotification(supabase, {
          userId: data.assignee_id,
          actorId: user.id,
          workspaceId: workspaceId,
          type: 'assign_task',
          title: `Bạn được giao công việc: ${data.title || oldTask.title}`,
          message: 'Hãy kiểm tra danh sách ảnh cần làm của bạn.',
          linkUrl: '/photo-tasks'
        });
      }
    }
  }

  const { data: updatedTask, error } = await supabase
    .from("photo_tasks")
    .update(payload)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating photo task:", error);
    throw new Error("Lỗi cơ sở dữ liệu: " + error.message);
  }

  revalidatePath("/photo-tasks");
  return updatedTask as PhotoTask;
}

export async function claimPhotoTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
    
  const fullName = profile?.full_name || user.email?.split('@')[0] || "Unknown";

  const { error } = await supabase
    .from("photo_tasks")
    .update({
      assignee_id: user.id,
      assignee_name: fullName,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error claiming photo task:", error);
    return { error: error.message };
  }

  revalidatePath("/photo-tasks");
  return { success: true };
}

export async function updatePhotoTaskStatus(taskId: string, status: PhotoTaskStatus) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("photo_tasks")
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error updating photo task status:", error);
    throw new Error(error.message);
  }

  revalidatePath("/photo-tasks");
  return { success: true };
}

export async function deletePhotoTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("photo_tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Error deleting photo task:", error);
    throw new Error(error.message);
  }

  revalidatePath("/photo-tasks");
  return { success: true };
}

export async function approvePhotoTaskAndPay(taskId: string, workspaceId: string, taskTitle: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: taskData, error: taskError } = await supabase
    .from("photo_tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();
    
  if (taskError || !taskData?.assignee_id) {
    console.error("Error getting assignee_id:", taskError);
    return { error: "Không tìm thấy người làm nhiệm vụ này để cộng lương." };
  }
  
  const targetUserId = taskData.assignee_id;

  const { error: updateError } = await supabase
    .from("photo_tasks")
    .update({ 
      review_status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (updateError) {
    console.error("Error approving photo task:", updateError);
    return { error: updateError.message };
  }

  // Tiền lương cho Ảnh có thể khác Video, nhưng hiện tại giữ mức giống Video, có thể điều chỉnh sau nếu có rule. Tạm thời dùng 250k.
  const RATE_BASE = 250000;
  const RATE_BONUS = 280000;
  const BONUS_THRESHOLD = 5;

  const now = new Date();
  const viewYear = now.getFullYear();
  const viewMonth = now.getMonth() + 1;

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
      clip_title: `Sản phẩm hoàn thành từ: ${taskTitle} (Ảnh)`,
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

  await createNotification(supabase, {
    userId: targetUserId,
    actorId: user.id,
    workspaceId: workspaceId,
    type: 'review_approved',
    title: `Sản phẩm ảnh được duyệt: ${taskTitle}`,
    message: `Thưởng lương: ${rate.toLocaleString()}đ`,
    linkUrl: '/photo-tasks'
  });

  revalidatePath("/photo-tasks");
  revalidatePath("/my-salary");
  return { success: true, rate, nextCount };
}

export async function revokePhotoTaskApprovalAndDeduct(taskId: string, taskTitle: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: taskData, error: taskError } = await supabase
    .from("photo_tasks")
    .select("assignee_id")
    .eq("id", taskId)
    .single();
    
  if (taskError || !taskData?.assignee_id) {
    console.error("Error getting assignee_id:", taskError);
    return { error: "Không tìm thấy người làm nhiệm vụ này để thu hồi lương." };
  }
  
  const targetUserId = taskData.assignee_id;

  const { error: updateError } = await supabase
    .from("photo_tasks")
    .update({ 
      review_status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (updateError) {
    console.error("Error revoking photo task:", updateError);
    return { error: updateError.message };
  }

  const { error: deleteError } = await supabase
    .from("salary_records")
    .delete()
    .eq("user_id", targetUserId)
    .eq("clip_title", `Sản phẩm hoàn thành từ: ${taskTitle} (Ảnh)`);

  if (deleteError) {
    console.error("Error deleting salary record:", deleteError);
  }

  await createNotification(supabase, {
    userId: targetUserId,
    actorId: user.id,
    workspaceId: null,
    type: 'review_rejected',
    title: `Sản phẩm ảnh bị TỪ CHỐI duyệt: ${taskTitle}`,
    message: `Lương tương ứng đã bị thu hồi.`,
    linkUrl: '/photo-tasks'
  });

  revalidatePath("/photo-tasks");
  revalidatePath("/my-salary");
  return { success: true };
}

export async function getPhotoTaskComments(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("photo_task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching photo task comments:", error);
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

export async function addPhotoTaskComment(taskId: string, content: string, imageUrl: string | null = null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
    
  const fullName = profile?.full_name || user.email?.split('@')[0] || "Unknown";

  const { data, error } = await supabase
    .from("photo_task_comments")
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
    console.error("Error adding photo task comment:", error);
    throw new Error(error.message);
  }

  const { data: taskInfo } = await supabase
    .from("photo_tasks")
    .select("title, assignee_id, workspace_id")
    .eq("id", taskId)
    .single();

  if (taskInfo && taskInfo.assignee_id && taskInfo.assignee_id !== user.id) {
    await createNotification(supabase, {
      userId: taskInfo.assignee_id,
      actorId: user.id,
      workspaceId: taskInfo.workspace_id,
      type: 'comment',
      title: `${fullName} đã nhận xét về ảnh: ${taskInfo.title}`,
      message: content,
      linkUrl: '/photo-tasks'
    });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (botToken && chatId) {
    const taskTitle = taskInfo?.title || "Không rõ";
    const message = `💬 <b>Nhận xét mới từ ${fullName}</b>\n\n📌 <b>Sản phẩm ảnh:</b> ${taskTitle}\n📝 <b>Nội dung:</b> ${content}`;
    
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

export async function unclaimPhotoTask(taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("photo_tasks")
    .update({
      assignee_id: null,
      assignee_name: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);

  if (error) {
    console.error("Error unclaiming photo task:", error);
    return { error: error.message };
  }

  revalidatePath("/photo-tasks");
  return { success: true };
}

export async function deletePhotoTaskComment(commentId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("photo_task_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting comment:", error);
    throw new Error(error.message);
  }

  return { success: true };
}
