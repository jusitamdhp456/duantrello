"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'revision' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  assignee_name: string | null;
  deadline: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
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
