"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

import type { Task, TaskStatus, TaskPriority } from "@/types/tasks";

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

  return data as Task[];
}

export async function createTask(workspaceId: string, data: Partial<Task>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: newTask, error } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      title: data.title,
      assignee_name: data.assignee_name || null,
      assignee_id: data.assignee_id || null,
      deadline: data.deadline || null,
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      video_url: data.video_url || null,
      product_url: data.product_url || null,
      review_status: data.review_status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    throw new Error(error.message);
  }

  revalidatePath("/tasks");
  return newTask as Task;
}

export async function updateTask(taskId: string, data: Partial<Task>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: updatedTask, error } = await supabase
    .from("tasks")
    .update({
      title: data.title,
      assignee_name: data.assignee_name,
      assignee_id: data.assignee_id,
      deadline: data.deadline,
      priority: data.priority,
      status: data.status,
      video_url: data.video_url,
      product_url: data.product_url,
      review_status: data.review_status,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    console.error("Error updating task:", error);
    throw new Error(error.message);
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
    throw new Error(error.message);
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
    throw new Error("Không tìm thấy người làm nhiệm vụ này để cộng lương.");
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
    throw new Error(updateError.message);
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
    throw new Error("Lỗi khi cộng lương: " + salaryError.message);
  }

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
    throw new Error("Không tìm thấy người làm nhiệm vụ này để thu hồi lương.");
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
    throw new Error(updateError.message);
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

  revalidatePath("/tasks");
  revalidatePath("/my-salary");
  return { success: true };
}
