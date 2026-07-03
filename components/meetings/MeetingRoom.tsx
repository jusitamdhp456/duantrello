"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Link2, ExternalLink, StickyNote, CheckSquare,
  Timer, X, Play, Square, FileText, Users, Video, MessageSquare
} from "lucide-react";
import AgendaTimer from "@/components/meetings/AgendaTimer";
import MeetingNotes from "@/components/meetings/MeetingNotes";
import MeetingActionItems from "@/components/meetings/MeetingActionItems";
import JitsiCall from "@/components/meetings/JitsiCall";
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
  const [sideOpen, setSideOpen] = useState(true);

  // Unique room name per meeting (sanitized for Jitsi)
  const jitsiRoomName = `duantrello-${meeting.id.replace(/-/g, "").slice(0, 20)}`;

  // Load notes + action items
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
    const result = await startMeeting(meeting.id);
    if (result.error) { alert("Lỗi: " + result.error); return; }
    if (result.data) setMeeting(result.data);
  };

  const handleEnd = async () => {
    if (!confirm("Bạn có chắc muốn kết thúc cuộc họp này?")) return;
    try {
      setEnding(true);
      const result = await endMeeting(meeting.id, meeting.started_at);
      if (result.error) { alert("Lỗi: " + result.error); return; }
      if (result.data) setMeeting(result.data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEnding(false);
    }
  };

  const handleSaveSummary = async () => {
    const result = await saveMeetingSummary(meeting.id, summary);
    if (result.error) { alert("Lỗi: " + result.error); return; }
    if (result.data) setMeeting(result.data);
    setShowSummaryEdit(false);
  };

  // Notes handlers
  const handleAddNote = useCallback(async (content: string, authorName: string) => {
    const result = await createMeetingNote(meeting.id, content, authorName);
    if (result.error) throw new Error(result.error);
    if (result.data) setNotes((prev) => [...prev, result.data!]);
  }, [meeting.id]);

  const handleUpdateNote = useCallback(async (noteId: string, content: string) => {
    const result = await updateMeetingNote(noteId, content);
    if (result.error) throw new Error(result.error);
    if (result.data) setNotes((prev) => prev.map((n) => n.id === noteId ? result.data! : n));
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    const result = await deleteMeetingNote(noteId);
    if (result.error) throw new Error(result.error);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }, []);

  // Action item handlers
  const handleAddActionItem = useCallback(async (payload: { title: string; assignee_name?: string; due_date?: string }) => {
    const result = await createMeetingActionItem(meeting.id, workspaceId, payload);
    if (result.error) throw new Error(result.error);
    if (result.data) setActionItems((prev) => [...prev, result.data!]);
  }, [meeting.id, workspaceId]);

  const handleToggleItem = useCallback(async (itemId: string, isCompleted: boolean) => {
    const result = await toggleActionItemComplete(itemId, isCompleted);
    if (result.error) throw new Error(result.error);
    if (result.data) setActionItems((prev) => prev.map((i) => i.id === itemId ? result.data! : i));
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    const result = await deleteMeetingActionItem(itemId);
    if (result.error) throw new Error(result.error);
    setActionItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const isOngoing = meeting.status === "ongoing";
  const isEnded = meeting.status === "ended";

  return (
    <div className="flex flex-col h-full min-h-[600px] gap-0 bg-gray-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      
      {/* ── Top Bar (Google Meet style) ──────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-950 border-b border-white/5 flex-shrink-0">
        {/* Left: Meeting info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/meetings")}
            className="p-1.5 text-white/50 hover:text-white/80 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-sm truncate">{meeting.title}</h1>
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-xs">
                {MEETING_TYPE_LABELS[meeting.type]}
              </span>
              {isOngoing && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {formatElapsed(elapsed)}
                </span>
              )}
              {isEnded && (
                <span className="text-xs text-green-400">✅ Đã kết thúc · {meeting.duration_minutes} phút</span>
              )}
            </div>
          </div>
        </div>

        {/* Center: room code */}
        {isOngoing && (
          <div className="hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
            <Video size={13} className="text-white/40" />
            <span className="text-white/50 text-xs font-mono truncate max-w-[160px]">{jitsiRoomName}</span>
          </div>
        )}

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {meeting.status === "scheduled" && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-green-500/30"
            >
              <Play size={14} />
              Bắt đầu họp
            </button>
          )}

          {isOngoing && (
            <button
              onClick={handleEnd}
              disabled={ending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full font-semibold text-sm hover:bg-red-700 transition-colors"
            >
              <Square size={13} />
              {ending ? "Đang kết thúc..." : "Kết thúc"}
            </button>
          )}

          {meeting.meet_link && (
            <a
              href={meeting.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở link họp ngoài"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-full text-xs font-medium transition-colors"
            >
              <Link2 size={13} />
              Link ngoài
              <ExternalLink size={11} />
            </a>
          )}

          {/* Toggle side panel */}
          <button
            onClick={() => setSideOpen((v) => !v)}
            className={`p-2 rounded-full text-sm transition-colors ${
              sideOpen
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
            }`}
            title={sideOpen ? "Ẩn panel" : "Hiện panel"}
          >
            <StickyNote size={16} />
          </button>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* Video area */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isEnded ? "hidden" : ""}`}>
          <div className="flex-1 min-h-0 p-3">
            <JitsiCall
              roomName={jitsiRoomName}
              displayName={currentUserName || currentUserEmail}
              isOngoing={isOngoing}
            />
          </div>
        </div>

        {/* Ended view: summary */}
        {isEnded && (
          <div className="flex-1 flex flex-col min-w-0 p-4 gap-4 overflow-y-auto">
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-purple-400" />
                <h2 className="font-bold text-white text-base">Tóm tắt cuộc họp</h2>
                <button
                  onClick={() => setShowSummaryEdit(!showSummaryEdit)}
                  className="ml-auto text-xs text-purple-400 hover:text-purple-300 font-medium"
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
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <button
                    onClick={handleSaveSummary}
                    className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
                  >
                    Lưu tóm tắt
                  </button>
                </div>
              ) : meeting.summary ? (
                <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{meeting.summary}</p>
              ) : (
                <div className="text-center py-6">
                  <p className="text-white/30 text-sm">Chưa có tóm tắt</p>
                  <button
                    onClick={() => setShowSummaryEdit(true)}
                    className="mt-2 text-purple-400 text-xs hover:text-purple-300 font-medium"
                  >
                    + Viết tóm tắt ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Side panel ──────────────────────────────────────────── */}
        {sideOpen && (
          <div className="w-80 xl:w-96 flex flex-col border-l border-white/5 bg-gray-900 flex-shrink-0">
            {/* Tabs */}
            <div className="flex gap-1 p-3 border-b border-white/5 flex-shrink-0">
              {([
                { key: "notes" as PanelTab, label: "Ghi chú", icon: <StickyNote size={13} />, count: notes.length },
                { key: "actions" as PanelTab, label: "Tasks", icon: <CheckSquare size={13} />, count: actionItems.length },
                ...(meeting.agenda?.length > 0
                  ? [{ key: "agenda" as PanelTab, label: "Agenda", icon: <Timer size={13} />, count: meeting.agenda.length }]
                  : []),
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 justify-center ${
                    activeTab === tab.key
                      ? "bg-purple-600 text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center ${
                      activeTab === tab.key ? "bg-white/20" : "bg-white/10 text-white/50"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden p-4">
              {activeTab === "notes" && (
                <MeetingNotes
                  notes={notes}
                  currentUserName={currentUserName}
                  onAdd={handleAddNote}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  darkMode
                />
              )}
              {activeTab === "actions" && (
                <MeetingActionItems
                  items={actionItems}
                  onAdd={handleAddActionItem}
                  onToggle={handleToggleItem}
                  onDelete={handleDeleteItem}
                  darkMode
                />
              )}
              {activeTab === "agenda" && meeting.agenda?.length > 0 && (
                <div className="h-full overflow-y-auto">
                  <AgendaTimer agenda={meeting.agenda} darkMode />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
