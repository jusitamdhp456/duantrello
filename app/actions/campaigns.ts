"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaign(workspaceId: string, name: string, budget: number, startDate: string, endDate: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      name,
      budget,
      start_date: startDate || null,
      end_date: endDate || null,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/campaigns");
  return data;
}

export async function deleteCampaign(campaignId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw new Error(error.message);
  revalidatePath("/campaigns");
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ status })
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
  revalidatePath("/campaigns");
}
