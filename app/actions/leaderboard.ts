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

    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("id, assignee_id, status, review_status")
      .eq("workspace_id", workspaceId)
      .not("assignee_id", "is", null);

    if (tasksError) {
      console.error("Lỗi khi lấy Tasks:", tasksError);
      return { error: tasksError.message };
    }

    const validTasks = tasksData?.filter(t => t.status === "completed" || t.review_status === "approved") || [];

    const userCounts: Record<string, number> = {};
    for (const task of validTasks) {
      const uid = task.assignee_id;
      if (uid) {
        userCounts[uid] = (userCounts[uid] || 0) + 1;
      }
    }

    const uniqueUserIds = Object.keys(userCounts);
    
    if (uniqueUserIds.length === 0) {
      return { data: [] };
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", uniqueUserIds);
      
    if (profilesError) {
      console.error("Lỗi khi lấy Profiles:", profilesError);
      return { error: profilesError.message };
    }

    const profileMap: Record<string, any> = {};
    for (const p of profilesData || []) {
      profileMap[p.id] = p;
    }

    let leaderboard: LeaderboardEntry[] = uniqueUserIds.map(uid => ({
      user_id: uid,
      full_name: profileMap[uid]?.full_name || "Ẩn danh",
      avatar_url: profileMap[uid]?.avatar_url || null,
      completed_tasks: userCounts[uid],
      rank_num: 0
    }));

    leaderboard.sort((a, b) => b.completed_tasks - a.completed_tasks);

    let currentRank = 1;
    for (let i = 0; i < leaderboard.length; i++) {
      if (i > 0 && leaderboard[i].completed_tasks < leaderboard[i - 1].completed_tasks) {
        currentRank = i + 1;
      }
      leaderboard[i].rank_num = currentRank;
    }

    return { data: leaderboard };
  } catch (err: any) {
    console.error("Lỗi khi lấy Leaderboard (catch):", err);
    return { error: err.message || "Lỗi không xác định" };
  }
}
