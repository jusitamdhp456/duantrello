"use server";

import { createClient } from "@/lib/supabase/server";
import { generatePresignedDownloadUrl, deleteR2Object } from "@/lib/r2/presign";
import { revalidatePath } from "next/cache";

export async function getMediaUrl(objectKey: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate a presigned URL that is valid for 1 hour
  const url = await generatePresignedDownloadUrl(objectKey);
  return url;
}

export async function deleteMediaAsset(assetId: string, objectKey: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership or workspace access
  const { data: asset, error: fetchError } = await supabase
    .from("media_assets")
    .select("workspace_id")
    .eq("id", assetId)
    .single();

  if (fetchError || !asset) throw new Error("Asset not found");

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", asset.workspace_id)
    .eq("user_id", user.id)
    .single();

  if (!member) throw new Error("Not authorized to delete in this workspace");

  // 1. Delete from Cloudflare R2
  try {
    await deleteR2Object(objectKey);
  } catch (err: any) {
    console.error("Failed to delete object from R2:", err);
    throw new Error("Failed to delete physical file");
  }

  // 2. Delete from Supabase
  const { error: dbError } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", assetId);

  if (dbError) throw new Error(dbError.message);

  revalidatePath("/media-library");
  return { success: true };
}
