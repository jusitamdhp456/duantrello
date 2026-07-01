"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Workspaces
export async function createWorkspace(name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const newWorkspaceId = crypto.randomUUID();

  const { error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ id: newWorkspaceId, name });

  if (workspaceError) throw new Error(workspaceError.message);

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: newWorkspaceId,
      user_id: user.id,
      role: 'owner'
    });

  if (memberError) throw new Error(memberError.message);

  revalidatePath("/");
  return { id: newWorkspaceId, name };
}
export async function updateWorkspaceName(workspaceId: string, name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("workspaces")
    .update({ name })
    .eq("id", workspaceId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWorkspace(workspaceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if owner
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();
    
  if (member?.role !== 'owner') {
    throw new Error("Must be owner to delete workspace");
  }

  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

// Members
export async function addMemberByEmail(workspaceId: string, email: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check if current user is owner or admin
  const { data: currentMember } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();
    
  if (currentMember?.role !== 'owner' && currentMember?.role !== 'admin') {
    throw new Error("Must be owner or admin to add members");
  }

  // Find user by email in profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (!profile) {
    throw new Error("User not found");
  }

  // Insert member
  const { error } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspaceId,
      user_id: profile.id,
      role: 'member'
    });

  if (error) {
    // Unique violation means already a member
    if (error.code === '23505') {
      throw new Error("User is already a member");
    }
    throw new Error(error.message);
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function removeMember(workspaceId: string, memberId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check role
  const { data: currentMember } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();
    
  if (currentMember?.role !== 'owner' && currentMember?.role !== 'admin' && user.id !== memberId) {
    throw new Error("Not authorized");
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  return { success: true };
}

export async function updateMemberRole(workspaceId: string, memberId: string, newRole: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check role (only owner can change roles)
  const { data: currentMember } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();
    
  if (currentMember?.role !== 'owner') {
    throw new Error("Only owners can change roles");
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role: newRole })
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberId);

  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  return { success: true };
}
