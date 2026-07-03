"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// =============================================
// Types
// =============================================
export type MeetingType = 'standup' | 'brainstorm' | 'review' | 'one_on_one' | 'general';
export type MeetingStatus = 'scheduled' | 'ongoing' | 'ended' | 'cancelled';

export interface AgendaItem {
  title: string;
  duration_minutes: number;
}

export interface Meeting {
  id: string;
  workspace_id: string;
  host_id: string;
  title: string;
  description: string | null;
  type: MeetingType;
  status: MeetingStatus;
  meet_link: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  agenda: AgendaItem[];
  summary: string | null;
  created_at: string;
  updated_at: string;
  host_name?: string;
  participant_count?: number;
}

export interface MeetingNote {
  id: string;
  meeting_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingActionItem {
  id: string;
  meeting_id: string;
  task_id: string | null;
  title: string;
  assignee_name: string | null;
  due_date: string | null;
  is_completed: boolean;
  created_by: string | null;
  created_at: string;
}

// =============================================
// Meetings CRUD
// =============================================

export async function getMeetings(workspaceId: string): Promise<Meeting[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("meetings")
    .select(`
      *,
      meeting_participants(count)
    `)
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((m: any) => ({
    ...m,
    agenda: m.agenda || [],
    participant_count: m.meeting_participants?.[0]?.count || 0,
  }));
}

export async function getMeetingById(meetingId: string): Promise<Meeting | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", meetingId)
    .single();

  if (error) return null;
  return { ...data, agenda: data.agenda || [] };
}

export async function createMeeting(
  workspaceId: string,
  payload: {
    title: string;
    description?: string;
    type: MeetingType;
    meet_link?: string;
    scheduled_at?: string;
    agenda?: AgendaItem[];
  }
): Promise<Meeting> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn chưa đăng nhập");

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      workspace_id: workspaceId,
      host_id: user.id,
      title: payload.title,
      description: payload.description || null,
      type: payload.type,
      status: "scheduled",
      meet_link: payload.meet_link || null,
      scheduled_at: payload.scheduled_at || null,
      agenda: payload.agenda || [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/meetings");
  return { ...data, agenda: data.agenda || [] };
}

export async function updateMeeting(
  meetingId: string,
  payload: Partial<{
    title: string;
    description: string;
    type: MeetingType;
    status: MeetingStatus;
    meet_link: string;
    scheduled_at: string;
    started_at: string;
    ended_at: string;
    duration_minutes: number;
    agenda: AgendaItem[];
    summary: string;
  }>
): Promise<Meeting> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("meetings")
    .update(payload)
    .eq("id", meetingId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/meetings");
  return { ...data, agenda: data.agenda || [] };
}

export async function startMeeting(meetingId: string): Promise<Meeting> {
  return updateMeeting(meetingId, {
    status: "ongoing",
    started_at: new Date().toISOString(),
  });
}

export async function endMeeting(meetingId: string, startedAt: string | null): Promise<Meeting> {
  const now = new Date();
  let durationMinutes: number | undefined;
  if (startedAt) {
    const diff = now.getTime() - new Date(startedAt).getTime();
    durationMinutes = Math.round(diff / 60000);
  }

  return updateMeeting(meetingId, {
    status: "ended",
    ended_at: now.toISOString(),
    duration_minutes: durationMinutes,
  });
}

export async function deleteMeeting(meetingId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", meetingId);
  if (error) throw new Error(error.message);
  revalidatePath("/meetings");
}

// =============================================
// Notes
// =============================================

export async function getMeetingNotes(meetingId: string): Promise<MeetingNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meeting_notes")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createMeetingNote(
  meetingId: string,
  content: string,
  authorName: string
): Promise<MeetingNote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("meeting_notes")
    .insert({
      meeting_id: meetingId,
      author_id: user?.id || null,
      author_name: authorName,
      content,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateMeetingNote(noteId: string, content: string): Promise<MeetingNote> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meeting_notes")
    .update({ content })
    .eq("id", noteId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMeetingNote(noteId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("meeting_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
}

// =============================================
// Action Items
// =============================================

export async function getMeetingActionItems(meetingId: string): Promise<MeetingActionItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meeting_action_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createMeetingActionItem(
  meetingId: string,
  workspaceId: string,
  payload: {
    title: string;
    assignee_name?: string;
    due_date?: string;
  }
): Promise<MeetingActionItem> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Also create a task in the tasks table
  let taskId: string | null = null;
  try {
    const { data: task } = await supabase
      .from("tasks")
      .insert({
        workspace_id: workspaceId,
        title: `[Meeting] ${payload.title}`,
        assignee_name: payload.assignee_name || null,
        deadline: payload.due_date ? new Date(payload.due_date).toISOString() : null,
        priority: "medium",
        status: "pending",
      })
      .select()
      .single();
    if (task) taskId = task.id;
  } catch {
    // If task creation fails, still create the action item
  }

  const { data, error } = await supabase
    .from("meeting_action_items")
    .insert({
      meeting_id: meetingId,
      task_id: taskId,
      title: payload.title,
      assignee_name: payload.assignee_name || null,
      due_date: payload.due_date || null,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function toggleActionItemComplete(
  itemId: string,
  isCompleted: boolean
): Promise<MeetingActionItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meeting_action_items")
    .update({ is_completed: isCompleted })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMeetingActionItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("meeting_action_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
}

// =============================================
// Save Meeting Summary
// =============================================

export async function saveMeetingSummary(meetingId: string, summary: string): Promise<Meeting> {
  return updateMeeting(meetingId, { summary });
}
