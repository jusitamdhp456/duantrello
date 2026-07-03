"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { LeaderboardEntry } from "@/app/actions/leaderboard";

interface Props {
  users: LeaderboardEntry[];
}

export default function LeaderboardList({ users }: Props) {
  if (users.length === 0) return null;

  const getAvatarInitials = (name: string | null) => {
    return (name || "?").charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-3xl mx-auto">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <h3 className="font-semibold text-gray-700">Các hạng tiếp theo</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {users.map((user) => (
          <div key={user.user_id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
            {/* Rank Number */}
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 flex-shrink-0">
              {user.rank_num}
            </div>
            
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt={user.full_name || ""} width={40} height={40} className="object-cover" />
              ) : (
                <span className="text-purple-600 font-bold text-lg">{getAvatarInitials(user.full_name)}</span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{user.full_name || "Ẩn danh"}</p>
            </div>

            {/* Score */}
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full flex-shrink-0">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="font-bold">{user.completed_tasks}</span>
              <span className="text-xs hidden sm:inline">sản phẩm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
