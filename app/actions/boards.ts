"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBoard(workspaceId: string, name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("boards")
    .insert({ workspace_id: workspaceId, name })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/boards");
  return data;
}

export async function deleteBoard(boardId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("boards").delete().eq("id", boardId);
  if (error) throw new Error(error.message);
  revalidatePath("/boards");
}

export async function createList(boardId: string, name: string) {
  const supabase = createClient();
  
  // Get max position
  const { data: lists } = await supabase
    .from("lists")
    .select("position")
    .eq("board_id", boardId)
    .order("position", { ascending: false })
    .limit(1);
    
  const position = lists && lists.length > 0 ? lists[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("lists")
    .insert({ board_id: boardId, name, position })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/boards/${boardId}`);
  return data;
}

export async function createCard(listId: string, title: string, boardId: string) {
  const supabase = createClient();
  
  const { data: cards } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", listId)
    .order("position", { ascending: false })
    .limit(1);
    
  const position = cards && cards.length > 0 ? cards[0].position + 1 : 0;

  const { data, error } = await supabase
    .from("cards")
    .insert({ list_id: listId, title, position })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/boards/${boardId}`);
  return data;
}

export async function updateListPosition(listId: string, newPosition: number, boardId?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("lists")
    .update({ position: newPosition })
    .eq("id", listId);
  if (error) throw new Error(error.message);
  if (boardId) {
    revalidatePath(`/boards/${boardId}`);
  }
}

export async function updateCardPosition(cardId: string, newListId: string, newPosition: number, boardId?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards")
    .update({ list_id: newListId, position: newPosition })
    .eq("id", cardId);
  if (error) throw new Error(error.message);
  if (boardId) {
    revalidatePath(`/boards/${boardId}`);
  }
}

export async function updateCardDetails(cardId: string, data: any) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards")
    .update(data)
    .eq("id", cardId);
  if (error) throw new Error(error.message);
}

// Checklist Actions
export async function createChecklist(cardId: string, title: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_checklists")
    .insert({ card_id: cardId, title })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createChecklistItem(checklistId: string, content: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_checklist_items")
    .insert({ checklist_id: checklistId, content })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function toggleChecklistItem(itemId: string, isCompleted: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("card_checklist_items")
    .update({ is_completed: isCompleted })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
}

// Comments Actions
export async function addComment(cardId: string, content: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("card_comments")
    .insert({ card_id: cardId, user_id: user.id, content })
    .select('*, profiles(full_name, email)')
    .single();
    
  if (error) throw new Error(error.message);
  return data;
}

// Labels Actions
export async function getBoardLabels(boardId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_labels")
    .select("*")
    .eq("board_id", boardId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createLabel(boardId: string, name: string, color: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("card_labels")
    .insert({ board_id: boardId, name, color })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function assignLabelToCard(cardId: string, labelId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards_labels_map")
    .insert({ card_id: cardId, label_id: labelId });
  if (error) throw new Error(error.message);
}

export async function removeLabelFromCard(cardId: string, labelId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards_labels_map")
    .delete()
    .match({ card_id: cardId, label_id: labelId });
  if (error) throw new Error(error.message);
}

// Members Actions
export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, profiles(full_name, email, avatar_url)")
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function assignMemberToCard(cardId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("card_members")
    .insert({ card_id: cardId, user_id: userId });
  if (error) throw new Error(error.message);
}

export async function removeMemberFromCard(cardId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("card_members")
    .delete()
    .match({ card_id: cardId, user_id: userId });
  if (error) throw new Error(error.message);
}
