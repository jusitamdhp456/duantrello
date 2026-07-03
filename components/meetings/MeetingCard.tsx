"use client";

import Link from "next/link";
import { Clock, Link2, ExternalLink, Users, Trash2, Play, Eye, Timer } from "lucide-react";
import type { Meeting } from "@/app/actions/meetings";

const MEETING_TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  general: { label: "Họp chung", emoji: "💼", color: "from-purple-400 to-indigo-400" },
  standup: { label: "Daily Standup", emoji: "⚡", color: "from-yellow-400 to-orange-400" },
  brainstorm: { label: "Brainstorm", emoji: "🧠", color: "from-pink-400 to-rose-400" },
  review: { label: "Review", emoji: "🔍", color: "from-blue-400 to-cyan-400" },
  one_on_one: { label: "1-on-1", emoji: "🤝", color: "from-green-400 to-emerald-400" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  scheduled: { label: "Sắp tới", dot: "bg-blue-400", badge: "bg-blue-50 text-blue-600" },
  ongoing: { label: "Đang diễn ra", dot: "bg-red-500 animate-ping", badge: "bg-red-50 text-red-600" },
  ended: { label: "Đã kết thúc", dot: "bg-gray-300", badge: "bg-gray-50 text-gray-500" },
  cancelled: { label: "Đã huỷ", dot: "bg-gray-200", badge: "bg-gray-50 text-gray-400" },
};

interface Props {
  meeting: Meeting;
  onDelete: (id: string) => void;
}

export default function MeetingCard({ meeting, onDelete }: Props) {
  const typeConfig = MEETING_TYPE_CONFIG[meeting.type] || MEETING_TYPE_CONFIG.general;
  const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;

  return (
    <div className="bg-neu-base rounded-2xl shadow-neu-convex hover:shadow-[12px_12px_24px_rgba(207,200,218,0.8),-12px_-12px_24px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
      {/* Gradient top bar */}
      <div className={`h-1.5 bg-gradient-to-r ${typeConfig.color}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${typeConfig.color} flex items-center justify-center text-xl flex-shrink-0 shadow-md`}>
              {typeConfig.emoji}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-base leading-snug truncate">{meeting.title}</h3>
              <p className="text-xs text-gray-400">{typeConfig.label}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusConfig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig.dot}`} />
            {statusConfig.label}
          </div>
        </div>

        {/* Description */}
        {meeting.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{meeting.description}</p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
          {meeting.scheduled_at && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-purple-300" />
              {new Date(meeting.scheduled_at).toLocaleString("vi-VN", {
                weekday: "short", day: "2-digit", month: "2-digit",
                hour: "2-digit", minute: "2-digit"
              })}
            </span>
          )}
          {meeting.duration_minutes && (
            <span className="flex items-center gap-1.5">
              <Timer size={12} className="text-green-300" />
              {meeting.duration_minutes} phút
            </span>
          )}
          {meeting.agenda?.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span>📋</span> {meeting.agenda.length} agenda
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/meetings/${meeting.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-100 transition-colors"
          >
            {meeting.status === "ongoing" ? <><Play size={14} /> Vào phòng họp</> : <><Eye size={14} /> Xem chi tiết</>}
          </Link>

          {meeting.meet_link && (
            <a
              href={meeting.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              title="Mở link họp"
            >
              <Link2 size={14} />
              <ExternalLink size={12} />
            </a>
          )}

          <button
            onClick={() => onDelete(meeting.id)}
            className="flex items-center justify-center p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
            title="Xóa cuộc họp"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
