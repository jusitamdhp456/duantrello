"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { getWorkspaceLeaderboard } from "@/app/actions/leaderboard";
import type { LeaderboardEntry } from "@/app/actions/leaderboard";
import LeaderboardList from "./LeaderboardList";
import { Award, Loader2 } from "lucide-react";

export default function LeaderboardView() {
  const { activeWorkspaceId } = useWorkspace();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      if (!activeWorkspaceId) return;
      
      setLoading(true);
      setError(null);
      
      const { data, error: err } = await getWorkspaceLeaderboard(activeWorkspaceId);
      
      if (err) {
        setError(err);
      } else if (data) {
        setEntries(data);
      }
      
      setLoading(false);
    }

    loadLeaderboard();
  }, [activeWorkspaceId]);

  if (!activeWorkspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Vui lòng chọn một workspace để xem bảng xếp hạng.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-[#0B1A2C] via-[#0D2942] to-[#0A4D6B] text-white">
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 mb-2 p-3 sm:p-4 border-b border-white/10">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
          <Award className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="font-bold text-white text-base sm:text-xl tracking-wide uppercase">Bảng Xếp Hạng</h2>
          <p className="text-[10px] sm:text-xs text-cyan-200/70 uppercase tracking-widest mt-0.5">Top Thành Tích Hoàn Thành</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 sm:px-6 pb-12 pt-2 sm:pt-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-400 bg-red-500/10 rounded-xl p-4 border border-red-500/20">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-cyan-200/40">
            <Award size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Chưa có dữ liệu xếp hạng</p>
            <p className="text-sm mt-2 opacity-60">Các sản phẩm hoàn thành sẽ được vinh danh tại đây</p>
          </div>
        ) : (
          <div className="animate-fade-in w-full max-w-4xl mx-auto">
            <LeaderboardList users={entries} />
          </div>
        )}
      </div>
    </div>
  );
}
