"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { LeaderboardEntry } from "@/app/actions/leaderboard";

interface Props {
  topUsers: LeaderboardEntry[];
}

export default function Podium({ topUsers }: Props) {
  const first = topUsers.find(u => u.rank_num === 1);
  const second = topUsers.find(u => u.rank_num === 2);
  const third = topUsers.find(u => u.rank_num === 3);

  const getAvatarInitials = (name: string | null) => {
    return (name || "?").charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-6 pt-12 pb-6 px-4">
      {/* 2nd Place - Gold */}
      {second && (
        <div className="flex flex-col items-center animate-fade-in-up [animation-delay:200ms] opacity-0 fill-mode-forwards z-0">
          <div className="relative mb-3">
            <div className="absolute -top-6 -right-2 text-2xl z-10 filter drop-shadow-md">🥇</div>
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-amber-500 rounded-full opacity-50 blur-sm"></div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)] overflow-hidden bg-yellow-50 flex items-center justify-center relative z-10">
              {second.avatar_url ? (
                <Image src={second.avatar_url} alt={second.full_name || ""} fill className="object-cover" />
              ) : (
                <span className="text-yellow-600 font-bold text-xl sm:text-3xl">{getAvatarInitials(second.full_name)}</span>
              )}
            </div>
          </div>
          <div className="w-24 sm:w-32 h-32 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-xl shadow-lg border-t-4 border-yellow-200 flex flex-col items-center pt-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <p className="font-bold text-yellow-900 text-sm sm:text-base text-center px-2 truncate w-full z-10 filter drop-shadow-sm">{second.full_name || "Ẩn danh"}</p>
            <div className="flex items-center gap-1 mt-1 text-amber-700 bg-white/70 px-2 py-0.5 rounded-full z-10">
              <CheckCircle2 size={12} className="text-amber-600" />
              <span className="font-bold text-xs sm:text-sm">{second.completed_tasks}</span>
            </div>
            <div className="mt-auto text-4xl sm:text-6xl font-black text-amber-700/30 -mb-2 z-10">2</div>
          </div>
        </div>
      )}

      {/* 1st Place - Diamond */}
      {first && (
        <div className="flex flex-col items-center animate-fade-in-up opacity-0 fill-mode-forwards z-10">
          <div className="relative mb-3 group cursor-default">
            <div className="absolute -top-8 -right-3 text-4xl z-10 filter drop-shadow-lg animate-bounce">💎</div>
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full opacity-70 blur-md group-hover:opacity-100 transition duration-500 animate-pulse"></div>
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] overflow-hidden bg-cyan-50 flex items-center justify-center relative z-10">
              {first.avatar_url ? (
                <Image src={first.avatar_url} alt={first.full_name || ""} fill className="object-cover" />
              ) : (
                <span className="text-cyan-500 font-bold text-2xl sm:text-4xl">{getAvatarInitials(first.full_name)}</span>
              )}
            </div>
          </div>
          <div className="w-28 sm:w-36 h-44 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-xl shadow-2xl shadow-cyan-500/30 border-t-4 border-cyan-200 flex flex-col items-center pt-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
            <div className="absolute top-10 right-4 w-2 h-2 bg-white rounded-full animate-ping [animation-delay:500ms]"></div>
            
            <p className="font-bold text-white text-sm sm:text-lg text-center px-2 truncate w-full z-10 filter drop-shadow-md">{first.full_name || "Ẩn danh"}</p>
            <div className="flex items-center gap-1 mt-2 text-cyan-900 bg-white/90 px-3 py-1 rounded-full z-10 shadow-sm">
              <CheckCircle2 size={14} className="text-cyan-600" />
              <span className="font-black text-xs sm:text-sm">{first.completed_tasks} sản phẩm</span>
            </div>
            <div className="mt-auto text-6xl sm:text-8xl font-black text-white/20 -mb-4 z-10">1</div>
          </div>
        </div>
      )}

      {/* 3rd Place - Silver */}
      {third && (
        <div className="flex flex-col items-center animate-fade-in-up [animation-delay:400ms] opacity-0 fill-mode-forwards z-0">
          <div className="relative mb-3">
            <div className="absolute -top-6 -right-2 text-2xl z-10 filter drop-shadow-md">🥈</div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-300 shadow-[0_0_15px_rgba(156,163,175,0.5)] overflow-hidden bg-gray-50 flex items-center justify-center relative z-10">
              {third.avatar_url ? (
                <Image src={third.avatar_url} alt={third.full_name || ""} fill className="object-cover" />
              ) : (
                <span className="text-gray-500 font-bold text-xl sm:text-3xl">{getAvatarInitials(third.full_name)}</span>
              )}
            </div>
          </div>
          <div className="w-24 sm:w-32 h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-xl shadow-lg border-t-4 border-gray-100 flex flex-col items-center pt-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <p className="font-bold text-gray-700 text-sm sm:text-base text-center px-2 truncate w-full z-10">{third.full_name || "Ẩn danh"}</p>
            <div className="flex items-center gap-1 mt-1 text-gray-600 bg-white/50 px-2 py-0.5 rounded-full z-10">
              <CheckCircle2 size={12} className="text-gray-500" />
              <span className="font-bold text-xs sm:text-sm">{third.completed_tasks}</span>
            </div>
            <div className="mt-auto text-4xl sm:text-6xl font-black text-gray-400/40 -mb-2 z-10">3</div>
          </div>
        </div>
      )}
    </div>
  );
}
