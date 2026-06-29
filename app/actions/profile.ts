"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(fullName: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message);
  }

  // Update user metadata in auth.users
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  if (authError) {
    console.error("Error updating auth user:", authError);
  }

  revalidatePath("/profile");
  return { success: true };
}
