"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { getWorkspaceLeaderboard } from "@/app/actions/leaderboard";
import type { LeaderboardEntry } from "@/app/actions/leaderboard";
import Podium from "./Podium";
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
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 flex items-center gap-2 mb-2 p-2">
        <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
          <Award size={18} />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Bảng Xếp Hạng</h2>
          <p className="text-xs text-gray-500">Thành tích làm việc của các thành viên (theo số sản phẩm hoàn thành)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-12">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Award size={48} className="mb-4 opacity-20" />
            <p>Chưa có ai hoàn thành sản phẩm nào.</p>
            <p className="text-sm">Hãy tạo và hoàn thành công việc để lọt vào bảng xếp hạng!</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Top 3 Podium */}
            <Podium topUsers={entries.filter(u => u.rank_num <= 3)} />

            {/* Rest of the leaderboard */}
            <LeaderboardList users={entries.filter(u => u.rank_num > 3)} />
          </div>
        )}
      </div>
    </div>
  );
}
