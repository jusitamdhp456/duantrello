"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, StickyNote } from "lucide-react";
import type { MeetingNote } from "@/app/actions/meetings";

interface Props {
  notes: MeetingNote[];
  currentUserName: string;
  onAdd: (content: string, authorName: string) => Promise<void>;
  onUpdate: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}

export default function MeetingNotes({ notes, currentUserName, onAdd, onUpdate, onDelete }: Props) {
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    try {
      setAdding(true);
      await onAdd(newNote.trim(), currentUserName);
      setNewNote("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (noteId: string) => {
    if (!editContent.trim()) return;
    try {
      await onUpdate(noteId, editContent.trim());
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (note: MeetingNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <StickyNote size={16} className="text-yellow-500" />
        <h3 className="font-semibold text-gray-700 text-sm">Ghi chú cuộc họp</h3>
        <span className="ml-auto text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
          {notes.length} ghi chú
        </span>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <StickyNote size={32} className="text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">Chưa có ghi chú nào</p>
            <p className="text-xs text-gray-300">Ghi lại những điểm quan trọng trong cuộc họp</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-100 group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-yellow-200 text-yellow-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {(note.author_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{note.author_name || "Ẩn danh"}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1 text-gray-400 hover:text-blue-500 rounded-lg transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => onDelete(note.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-sm text-gray-700 bg-white rounded-lg p-2 border border-yellow-200 outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      <Check size={12} /> Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      <X size={12} /> Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              )}

              <p className="text-[10px] text-gray-400 mt-2">
                {new Date(note.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add note input */}
      <div className="flex-shrink-0 border-t border-gray-100 pt-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAdd();
          }}
          placeholder="Ghi chú điểm quan trọng... (Ctrl+Enter để lưu)"
          rows={3}
          className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-300 outline-none text-gray-700 placeholder-gray-300 resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!newNote.trim() || adding}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Plus size={16} />
          {adding ? "Đang lưu..." : "Thêm ghi chú"}
        </button>
      </div>
    </div>
  );
}
