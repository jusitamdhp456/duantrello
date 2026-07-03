"use client";

import { useState } from "react";
import { Plus, Trash2, CheckSquare, Square, CheckCircle2, ArrowUpRight } from "lucide-react";
import type { MeetingActionItem } from "@/app/actions/meetings";

interface Props {
  items: MeetingActionItem[];
  onAdd: (payload: { title: string; assignee_name?: string; due_date?: string }) => Promise<void>;
  onToggle: (itemId: string, isCompleted: boolean) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export default function MeetingActionItems({ items, onAdd, onToggle, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const completedCount = items.filter((i) => i.is_completed).length;

  const handleAdd = async () => {
    if (!title.trim()) return;
    try {
      setAdding(true);
      await onAdd({
        title: title.trim(),
        assignee_name: assignee.trim() || undefined,
        due_date: dueDate || undefined,
      });
      setTitle("");
      setAssignee("");
      setDueDate("");
      setShowForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckSquare size={16} className="text-green-500" />
        <h3 className="font-semibold text-gray-700 text-sm">Action Items</h3>
        {items.length > 0 && (
          <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
            {completedCount}/{items.length} xong
          </span>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <CheckCircle2 size={32} className="text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">Chưa có action item nào</p>
            <p className="text-xs text-gray-300">Tạo task ngay trong cuộc họp</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all group ${
                item.is_completed
                  ? "bg-gray-50 border-gray-100 opacity-60"
                  : "bg-green-50 border-green-100"
              }`}
            >
              <button
                onClick={() => onToggle(item.id, !item.is_completed)}
                className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-green-500 transition-colors"
              >
                {item.is_completed ? (
                  <CheckSquare size={18} className="text-green-500" />
                ) : (
                  <Square size={18} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium text-gray-700 ${item.is_completed ? "line-through text-gray-400" : ""}`}>
                  {item.title}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {item.assignee_name && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      👤 {item.assignee_name}
                    </span>
                  )}
                  {item.due_date && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      📅 {new Date(item.due_date).toLocaleDateString("vi-VN")}
                    </span>
                  )}
                  {item.task_id && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowUpRight size={10} /> Đã tạo task
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <div className="flex-shrink-0 border-t border-gray-100 pt-4">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-green-200 text-green-500 rounded-xl font-medium text-sm hover:border-green-400 hover:bg-green-50 transition-all"
          >
            <Plus size={16} />
            Thêm Action Item
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên việc cần làm..."
              autoFocus
              className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-300 outline-none text-gray-700 placeholder-gray-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Người phụ trách..."
                className="bg-neu-base shadow-neu-concave border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-300 outline-none text-gray-700 placeholder-gray-300"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-neu-base shadow-neu-concave border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-300 outline-none text-gray-600"
              />
            </div>
            <p className="text-[10px] text-gray-400">
              ✨ Action item sẽ tự động tạo task tương ứng ở trang /tasks
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!title.trim() || adding}
                className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {adding ? "Đang tạo..." : "✅ Tạo"}
              </button>
              <button
                onClick={() => { setShowForm(false); setTitle(""); setAssignee(""); setDueDate(""); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
