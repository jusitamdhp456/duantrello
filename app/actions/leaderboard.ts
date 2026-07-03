"use server";

import { createClient } from "@/lib/supabase/server";

export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  completed_tasks: number;
  rank_num: number;
}

export async function getWorkspaceLeaderboard(workspaceId: string): Promise<{ data?: LeaderboardEntry[]; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "Bạn chưa đăng nhập" };
    }

    // Call the RPC function
    const { data, error } = await supabase
      .rpc('get_workspace_leaderboard', { p_workspace_id: workspaceId });

    if (error) {
      console.error("Lỗi khi lấy Leaderboard:", error);
      return { error: error.message };
    }

    return { data: data as LeaderboardEntry[] };
  } catch (err: any) {
    console.error("Lỗi khi lấy Leaderboard (catch):", err);
    return { error: err.message || "Đã xảy ra lỗi không xác định" };
  }
}
