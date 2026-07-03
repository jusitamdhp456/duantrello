"use client";

import { useState } from "react";
import { X, Calendar, Link2, Clock, Plus, Trash2 } from "lucide-react";
import type { MeetingType, AgendaItem } from "@/app/actions/meetings";

const MEETING_TYPES: { value: MeetingType; label: string; emoji: string }[] = [
  { value: "general", label: "Họp chung", emoji: "💼" },
  { value: "standup", label: "Daily Standup", emoji: "⚡" },
  { value: "brainstorm", label: "Brainstorm", emoji: "🧠" },
  { value: "review", label: "Review", emoji: "🔍" },
  { value: "one_on_one", label: "1-on-1", emoji: "🤝" },
];

interface Props {
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description?: string;
    type: MeetingType;
    meet_link?: string;
    scheduled_at?: string;
    agenda?: AgendaItem[];
  }) => Promise<void>;
}

export default function CreateMeetingModal({ onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<MeetingType>("general");
  const [meetLink, setMeetLink] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [newAgendaTitle, setNewAgendaTitle] = useState("");
  const [newAgendaDuration, setNewAgendaDuration] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const addAgendaItem = () => {
    if (!newAgendaTitle.trim()) return;
    setAgenda((prev) => [...prev, { title: newAgendaTitle.trim(), duration_minutes: newAgendaDuration }]);
    setNewAgendaTitle("");
    setNewAgendaDuration(10);
  };

  const removeAgendaItem = (idx: number) => {
    setAgenda((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalAgendaMinutes = agenda.reduce((acc, a) => acc + a.duration_minutes, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        meet_link: meetLink.trim() || undefined,
        scheduled_at: scheduledAt || undefined,
        agenda: agenda.length > 0 ? agenda : undefined,
      });
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neu-base rounded-[2rem] w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-white/60 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-7 pt-7 pb-5 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">📅 Tạo cuộc họp mới</h2>
            <p className="text-xs text-gray-400 mt-0.5">Điền thông tin để lên lịch họp cho team</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 pb-7">
          <form onSubmit={handleSubmit} id="create-meeting-form" className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Tiêu đề cuộc họp <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Daily Standup buổi sáng..."
                className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none text-gray-700 placeholder-gray-300"
              />
            </div>

            {/* Meeting Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Loại cuộc họp
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {MEETING_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setType(mt.value)}
                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${
                      type === mt.value
                        ? "bg-purple-500 text-white shadow-lg scale-105"
                        : "bg-neu-base shadow-neu-convex text-gray-500 hover:shadow-neu-concave"
                    }`}
                  >
                    <span className="text-lg">{mt.emoji}</span>
                    <span>{mt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Mô tả (tuỳ chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mục tiêu, nội dung cuộc họp..."
                rows={2}
                className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none text-gray-700 placeholder-gray-300 resize-none"
              />
            </div>

            {/* Scheduled At + Meet Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-purple-400" />
                  Thời gian họp
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Link2 size={14} className="text-blue-400" />
                  Link họp (Meet/Zoom)
                </label>
                <input
                  type="url"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none text-gray-600 placeholder-gray-300"
                />
              </div>
            </div>

            {/* Agenda */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <Clock size={14} className="text-orange-400" />
                Agenda (tuỳ chọn)
                {agenda.length > 0 && (
                  <span className="ml-auto text-xs text-gray-400 font-normal">
                    Tổng: {totalAgendaMinutes} phút
                  </span>
                )}
              </label>

              {/* Agenda items list */}
              {agenda.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {agenda.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-neu-base shadow-neu-convex rounded-xl px-4 py-2.5 group"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 truncate">{item.title}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock size={11} /> {item.duration_minutes}p
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(idx)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add agenda item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAgendaTitle}
                  onChange={(e) => setNewAgendaTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAgendaItem();
                    }
                  }}
                  placeholder="Thêm mục agenda..."
                  className="flex-1 bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-300 outline-none text-gray-700 placeholder-gray-300"
                />
                <input
                  type="number"
                  value={newAgendaDuration}
                  onChange={(e) => setNewAgendaDuration(Number(e.target.value))}
                  min={1}
                  max={120}
                  className="w-16 bg-neu-base shadow-neu-concave border-none rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-300 outline-none text-center text-gray-700"
                  title="Số phút"
                />
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="w-10 h-10 flex items-center justify-center bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors flex-shrink-0"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Số bên cạnh là số phút cho mỗi mục</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 pb-7 pt-3 flex-shrink-0 border-t border-gray-100 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-neu-base rounded-xl text-gray-600 font-medium shadow-neu-convex hover:shadow-neu-concave transition-all text-sm"
          >
            Hủy
          </button>
          <button
            form="create-meeting-form"
            type="submit"
            disabled={submitting || !title.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "✨ Tạo cuộc họp"}
          </button>
        </div>
      </div>
    </div>
  );
}
