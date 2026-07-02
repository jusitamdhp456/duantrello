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

  // Đếm số lượng clip hiện tại trong tháng
  const { data: currentRecords } = await supabase
    .from("salary_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("period_year", viewYear)
    .eq("period_month", viewMonth);

  const totalClips = currentRecords ? currentRecords.length : 0;
  const nextCount = totalClips + 1;
  const rate = totalClips >= BONUS_THRESHOLD ? RATE_BONUS : RATE_BASE;

  const { error: salaryError } = await supabase
    .from("salary_records")
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
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
