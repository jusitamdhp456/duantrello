"use client";

import type { LeaderboardEntry } from "@/app/actions/leaderboard";
import { CheckSquare } from "lucide-react";

interface Props {
  users: LeaderboardEntry[];
}

export default function LeaderboardList({ users }: Props) {
  if (users.length === 0) return null;

  const getAvatarInitials = (name: string | null) => {
    return (name || "?").charAt(0).toUpperCase();
  };

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-4">
      {users.map((user, index) => {
        // Thêm animation delay mượt mà
        const delay = index * 100;
        
        return (
          <div 
            key={user.user_id} 
            className="flex items-center gap-3 sm:gap-6 w-full opacity-0 animate-fade-in-up fill-mode-forwards group hover:bg-white/5 p-2 sm:p-3 rounded-xl transition-colors"
            style={{ animationDelay: `${delay}ms` }}
          >
            {/* Rank Number */}
            <div className="w-8 sm:w-16 flex-shrink-0 text-center sm:text-right">
              <span className="text-2xl sm:text-4xl font-extrabold text-white drop-shadow-md">
                {user.rank_num.toString().padStart(2, '0')}
              </span>
            </div>
            
            {/* Sci-fi Avatar */}
            <div className="relative flex-shrink-0">
              <div 
                className="w-12 h-12 sm:w-20 sm:h-20 bg-cyan-400 p-[2px] transition-all duration-300 group-hover:bg-cyan-300 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
              >
                <div 
                  className="w-full h-full bg-[#0A1A2F] flex items-center justify-center relative overflow-hidden"
                  style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}
                >
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.full_name || ""} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                  ) : (
                    <span className="text-cyan-400 font-bold text-lg sm:text-2xl">
                      {getAvatarInitials(user.full_name)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-xl text-white truncate uppercase tracking-wider">
                {user.full_name || "Ẩn danh"}
              </p>
            </div>

            {/* Score box */}
            <div className="flex-shrink-0">
              <div className="flex flex-col items-center justify-center w-12 h-12 sm:w-20 sm:h-20 border border-cyan-500/30 rounded-lg bg-cyan-950/40 backdrop-blur-sm group-hover:bg-cyan-900/60 transition-colors">
                <CheckSquare size={16} className="text-cyan-400 mb-0.5 sm:w-5 sm:h-5 sm:mb-1" />
                <span className="text-[9px] sm:text-xs text-cyan-200/70 uppercase font-semibold leading-none mb-0.5">S.Phẩm</span>
                <span className="text-sm sm:text-lg font-bold text-white leading-none">{user.completed_tasks}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
