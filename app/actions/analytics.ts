"use server";

import { createClient } from "@/lib/supabase/server";

export async function getWorkspaceMetrics(workspaceId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch all metrics for the workspace
  const { data, error } = await supabase
    .from("ad_metrics")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    return {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      averageRoas: 0
    };
  }

  // Aggregate
  const totalSpend = data.reduce((acc, curr) => acc + (Number(curr.spend) || 0), 0);
  const totalImpressions = data.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
  const totalClicks = data.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const totalConversions = data.reduce((acc, curr) => acc + (curr.conversions || 0), 0);
  
  // ROAS average (simple average for MVP)
  const roasSum = data.reduce((acc, curr) => acc + (Number(curr.roas) || 0), 0);
  const averageRoas = roasSum / data.length;

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    averageRoas
  };
}
