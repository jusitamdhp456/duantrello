"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Link2, ExternalLink, StickyNote, CheckSquare,
  Timer, X, Play, Square, FileText, Users, ChevronDown
} from "lucide-react";
import AgendaTimer from "@/components/meetings/AgendaTimer";
import MeetingNotes from "@/components/meetings/MeetingNotes";
import MeetingActionItems from "@/components/meetings/MeetingActionItems";
import type { Meeting, MeetingNote, MeetingActionItem } from "@/app/actions/meetings";
import {
  getMeetingNotes, createMeetingNote, updateMeetingNote, deleteMeetingNote,
  getMeetingActionItems, createMeetingActionItem, toggleActionItemComplete, deleteMeetingActionItem,
  startMeeting, endMeeting, saveMeetingSummary,
} from "@/app/actions/meetings";

type PanelTab = "notes" | "actions" | "agenda";

const MEETING_TYPE_LABELS: Record<string, string> = {
  general: "💼 Họp chung",
  standup: "⚡ Daily Standup",
  brainstorm: "🧠 Brainstorm",
  review: "🔍 Review",
  one_on_one: "🤝 1-on-1",
};

interface Props {
  meeting: Meeting;
  workspaceId: string;
  currentUserName: string;
  currentUserEmail: string;
}

export default function MeetingRoom({ meeting: initialMeeting, workspaceId, currentUserName, currentUserEmail }: Props) {
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting>(initialMeeting);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([]);
  const [activeTab, setActiveTab] = useState<PanelTab>("notes");
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState(meeting.summary || "");
  const [showSummaryEdit, setShowSummaryEdit] = useState(false);
  const [ending, setEnding] = useState(false);

  // Load data
  useEffect(() => {
    getMeetingNotes(meeting.id).then(setNotes).catch(console.error);
    getMeetingActionItems(meeting.id).then(setActionItems).catch(console.error);
  }, [meeting.id]);

  // Elapsed timer when ongoing
  useEffect(() => {
    if (meeting.status !== "ongoing" || !meeting.started_at) return;
    const startTime = new Date(meeting.started_at).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [meeting.status, meeting.started_at]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    try {
      const updated = await startMeeting(meeting.id);
      setMeeting(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEnd = async () => {
    if (!confirm("Bạn có chắc muốn kết thúc cuộc họp này?")) return;
    try {
      setEnding(true);
      const updated = await endMeeting(meeting.id, meeting.started_at);
      setMeeting(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEnding(false);
    }
  };

  const handleSaveSummary = async () => {
    try {
      const updated = await saveMeetingSummary(meeting.id, summary);
      setMeeting(updated);
      setShowSummaryEdit(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Notes handlers
  const handleAddNote = useCallback(async (content: string, authorName: string) => {
    const note = await createMeetingNote(meeting.id, content, authorName);
    setNotes((prev) => [...prev, note]);
  }, [meeting.id]);

  const handleUpdateNote = useCallback(async (noteId: string, content: string) => {
    const updated = await updateMeetingNote(noteId, content);
    setNotes((prev) => prev.map((n) => n.id === noteId ? updated : n));
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await deleteMeetingNote(noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  // Action item handlers
  const handleAddActionItem = useCallback(async (payload: { title: string; assignee_name?: string; due_date?: string }) => {
    const item = await createMeetingActionItem(meeting.id, workspaceId, payload);
    setActionItems((prev) => [...prev, item]);
  }, [meeting.id, workspaceId]);

  const handleToggleItem = useCallback(async (itemId: string, isCompleted: boolean) => {
    const updated = await toggleActionItemComplete(itemId, isCompleted);
    setActionItems((prev) => prev.map((i) => i.id === itemId ? updated : i));
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    await deleteMeetingActionItem(itemId);
    setActionItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const statusConfig = {
    scheduled: { label: "Chưa bắt đầu", color: "bg-gray-100 text-gray-600" },
    ongoing: { label: "🔴 Đang diễn ra", color: "bg-red-100 text-red-600 animate-pulse" },
    ended: { label: "✅ Đã kết thúc", color: "bg-green-100 text-green-600" },
    cancelled: { label: "Đã huỷ", color: "bg-gray-100 text-gray-400" },
  };

  const { label: statusLabel, color: statusColor } = statusConfig[meeting.status];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header card */}
      <div className="bg-neu-base rounded-3xl shadow-neu-convex p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 font-medium">
                {MEETING_TYPE_LABELS[meeting.type] || meeting.type}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
              {meeting.status === "ongoing" && (
                <span className="text-xs font-mono font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                  {formatElapsed(elapsed)}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-800 truncate">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{meeting.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {meeting.meet_link && (
              <a
                href={meeting.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors"
              >
                <Link2 size={15} />
                Vào họp
                <ExternalLink size={13} />
              </a>
            )}

            {meeting.status === "scheduled" && (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all shadow-lg"
              >
                <Play size={14} /> Bắt đầu họp
              </button>
            )}

            {meeting.status === "ongoing" && (
              <button
                onClick={handleEnd}
                disabled={ending}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium text-sm hover:bg-red-600 transition-colors"
              >
                <Square size={14} /> {ending ? "Đang kết thúc..." : "Kết thúc"}
              </button>
            )}

            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 bg-neu-base shadow-neu-convex rounded-xl hover:shadow-neu-concave transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Meeting info row */}
        {meeting.scheduled_at && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-purple-400" />
              {new Date(meeting.scheduled_at).toLocaleString("vi-VN", {
                weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
              })}
            </span>
            {meeting.duration_minutes && (
              <span className="flex items-center gap-1.5">
                <Timer size={13} className="text-green-400" />
                {meeting.duration_minutes} phút
              </span>
            )}
            {meeting.meet_link && (
              <span className="flex items-center gap-1.5">
                <Link2 size={13} className="text-blue-400" />
                <span className="truncate max-w-xs">{meeting.meet_link}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main area: Meeting summary (ended) or working panel */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

        {/* Left: Summary (if ended) or big agenda */}
        {meeting.status === "ended" && (
          <div className="lg:w-1/2 flex flex-col gap-4">
            {/* Summary */}
            <div className="bg-neu-base rounded-3xl shadow-neu-convex p-6 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-purple-500" />
                <h2 className="font-bold text-gray-700">Tóm tắt cuộc họp</h2>
                <button
                  onClick={() => setShowSummaryEdit(!showSummaryEdit)}
                  className="ml-auto text-xs text-purple-500 hover:text-purple-700 font-medium"
                >
                  {showSummaryEdit ? "Hủy" : "✏️ Chỉnh sửa"}
                </button>
              </div>
              {showSummaryEdit ? (
                <div className="space-y-3">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Viết tóm tắt cuộc họp, kết luận, quyết định..."
                    rows={6}
                    className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none text-gray-700 placeholder-gray-300 resize-none"
                  />
                  <button
                    onClick={handleSaveSummary}
                    className="w-full py-2.5 bg-purple-500 text-white rounded-xl font-semibold text-sm hover:bg-purple-600 transition-colors"
                  >
                    Lưu tóm tắt
                  </button>
                </div>
              ) : meeting.summary ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{meeting.summary}</p>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-center">
                  <p className="text-xs text-gray-400">Chưa có tóm tắt</p>
                  <button
                    onClick={() => setShowSummaryEdit(true)}
                    className="mt-2 text-xs text-purple-500 hover:text-purple-700 font-medium"
                  >
                    + Viết tóm tắt ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right panel: Tabs for Notes / Actions / Agenda */}
        <div className={`flex flex-col ${meeting.status === "ended" ? "lg:w-1/2" : "flex-1"} bg-neu-base rounded-3xl shadow-neu-convex min-h-0`}>
          {/* Tabs */}
          <div className="flex gap-1 p-3 flex-shrink-0 border-b border-gray-100">
            {([
              { key: "notes", label: "📝 Ghi chú", badge: notes.length },
              { key: "actions", label: "✅ Action Items", badge: actionItems.length },
              ...(meeting.agenda?.length > 0 ? [{ key: "agenda", label: "⏱ Agenda", badge: meeting.agenda.length }] : []),
            ] as { key: PanelTab; label: string; badge: number }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                    activeTab === tab.key ? "bg-white/30 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden p-5">
            {activeTab === "notes" && (
              <MeetingNotes
                notes={notes}
                currentUserName={currentUserName}
                onAdd={handleAddNote}
                onUpdate={handleUpdateNote}
                onDelete={handleDeleteNote}
              />
            )}
            {activeTab === "actions" && (
              <MeetingActionItems
                items={actionItems}
                onAdd={handleAddActionItem}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
              />
            )}
            {activeTab === "agenda" && meeting.agenda?.length > 0 && (
              <div className="h-full overflow-y-auto">
                <AgendaTimer agenda={meeting.agenda} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
