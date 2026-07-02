"use client";

import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { DollarSign, Plus, Trash2, ChevronLeft, ChevronRight, Calendar, TrendingUp, Film, CheckCircle } from "lucide-react";

const RATE_BASE = 250000;      // 250k/clip
const RATE_BONUS = 280000;     // 280k/clip từ clip thứ 6 trở đi
const BONUS_THRESHOLD = 5;     // Hoàn thành đủ 5 clip thì từ clip 6 tính giá bonus

interface SalaryRecord {
  id: string;
  clip_title: string;
  completed_at: string;
  clip_count_in_month: number;
  rate_per_clip: number;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function getMonthName(month: number) {
  const names = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];
  return names[month - 1];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun, 1=Mon, ...
}

export default function MySalaryPage() {
  const { activeWorkspaceId } = useWorkspace();
  const supabase = createClient();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newClipTitle, setNewClipTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data } = await supabase
      .from("salary_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_year", viewYear)
      .eq("period_month", viewMonth)
      .order("clip_count_in_month", { ascending: true });

    setRecords(data || []);
    setIsLoading(false);
  }, [supabase, viewYear, viewMonth]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const totalSalary = records.reduce((sum, r) => sum + r.rate_per_clip, 0);
  const totalClips = records.length;

  // Tính rate cho clip tiếp theo
  const nextRate = totalClips >= BONUS_THRESHOLD ? RATE_BONUS : RATE_BASE;

  // Nhóm record theo ngày
  const recordsByDay: Record<number, SalaryRecord[]> = {};
  records.forEach((r) => {
    const day = new Date(r.completed_at).getDate();
    if (!recordsByDay[day]) recordsByDay[day] = [];
    recordsByDay[day].push(r);
  });

  async function handleAddClip() {
    if (!newClipTitle.trim() || selectedDay === null) return;
    setIsAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsAdding(false); return; }

    const nextCount = totalClips + 1;
    const rate = totalClips >= BONUS_THRESHOLD ? RATE_BONUS : RATE_BASE;

    const completedAt = new Date(viewYear, viewMonth - 1, selectedDay, 12, 0, 0);

    await supabase.from("salary_records").insert({
      workspace_id: activeWorkspaceId,
      user_id: user.id,
      clip_title: newClipTitle.trim(),
      completed_at: completedAt.toISOString(),
      period_year: viewYear,
      period_month: viewMonth,
      clip_count_in_month: nextCount,
      rate_per_clip: rate,
    });

    setNewClipTitle("");
    setShowAddModal(false);
    setSelectedDay(null);
    fetchRecords();
    setIsAdding(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("salary_records").delete().eq("id", id);
    fetchRecords();
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth); // 0=Sun

  // Chuyển về Mon-based (Mon=0...Sun=6)
  const firstDayMon = (firstDay + 6) % 7;

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-gray-700 tracking-wide flex items-center gap-3">
            <div className="p-3 rounded-2xl shadow-neu-convex">
              <DollarSign className="w-7 h-7 text-purple-500" />
            </div>
            Lương của tôi
          </h1>
          <p className="text-gray-400 mt-2 ml-1 text-sm">
            Tự động tính lương theo số clip hoàn thành mỗi tháng
          </p>
        </div>
        <button
          onClick={() => { setSelectedDay(null); setShowAddModal(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl shadow-neu-convex text-purple-600 font-semibold text-sm hover:shadow-neu-concave transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Thêm clip
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neu-base rounded-2xl shadow-neu-convex p-5 text-center">
          <Film className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
          <p className="text-2xl font-light text-gray-700">{totalClips}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Clip hoàn thành</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-[0_10px_20px_rgba(168,85,247,0.4)] p-5 text-center transform hover:-translate-y-1 transition-all duration-300 border border-purple-400">
          <DollarSign className="w-6 h-6 text-white/90 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white tracking-wide">{formatVND(totalSalary)}</p>
          <p className="text-xs text-purple-100 mt-1 uppercase tracking-wider font-medium">Tổng lương tháng</p>
        </div>
        <div className="bg-neu-base rounded-2xl shadow-neu-convex p-5 text-center">
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <p className="text-2xl font-light text-gray-700">{formatVND(nextRate)}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
            {totalClips >= BONUS_THRESHOLD ? "Đơn giá bonus 🎉" : `Đơn giá clip tiếp theo`}
          </p>
        </div>
      </div>

      {/* Quy tắc tính lương */}
      <div className="bg-neu-base rounded-2xl shadow-neu-convex p-4 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-neu-concave">
          <span className="text-purple-500 font-semibold">Clip 1–5</span>
          <span className="text-gray-400">=</span>
          <span className="font-bold text-gray-700">250.000 ₫/clip</span>
        </div>
        <span className="text-gray-300">|</span>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-neu-concave">
          <span className="text-green-500 font-semibold">Clip 6 trở đi</span>
          <span className="text-gray-400">=</span>
          <span className="font-bold text-gray-700">280.000 ₫/clip</span>
        </div>
        <span className="text-gray-300">|</span>
        <span className="text-xs text-gray-400 italic">Reset lại vào đầu mỗi tháng</span>
      </div>

      {/* Calendar */}
      <div className="bg-neu-base rounded-2xl shadow-neu-convex p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl shadow-neu-convex hover:shadow-neu-concave transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            {getMonthName(viewMonth)} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl shadow-neu-convex hover:shadow-neu-concave transition-all"
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayMon }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayRecords = recordsByDay[day] || [];
            const hasClips = dayRecords.length > 0;
            const isToday = day === now.getDate() && viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear();

            return (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  setShowAddModal(true);
                }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 hover:shadow-neu-concave text-xs
                  ${isToday ? "shadow-neu-concave text-purple-600 font-bold" : "shadow-neu-convex text-gray-600"}
                  ${hasClips ? "border-2 border-purple-200" : ""}
                `}
              >
                <span>{day}</span>
                {hasClips && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayRecords.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-purple-400" />
                    ))}
                    {dayRecords.length > 3 && <div className="w-1 h-1 rounded-full bg-gray-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List of clips this month */}
      <div className="bg-neu-base rounded-2xl shadow-neu-convex p-6">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Danh sách clip {getMonthName(viewMonth)} {viewYear}
        </h3>

        {isLoading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
        ) : records.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            Chưa có clip nào trong tháng này. Bấm &quot;Thêm clip&quot; để bắt đầu!
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => {
              const day = new Date(r.completed_at).getDate();
              const isBonus = r.rate_per_clip === RATE_BONUS;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl shadow-neu-concave"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full shadow-neu-convex flex items-center justify-center text-xs font-bold ${isBonus ? "text-green-600" : "text-purple-600"}`}>
                      #{r.clip_count_in_month}
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">{r.clip_title}</p>
                      <p className="text-xs text-gray-400">
                        Ngày {day}/{viewMonth}/{viewYear}
                        {isBonus && <span className="ml-2 text-green-500 font-semibold">★ Bonus rate</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-sm ${isBonus ? "text-green-600" : "text-purple-600"}`}>
                      {formatVND(r.rate_per_clip)}
                    </span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 rounded-xl shadow-neu-convex hover:shadow-neu-concave text-gray-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total row */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 shadow-neu-concave border border-purple-100">
              <span className="font-bold text-gray-700">Tổng lương tháng {viewMonth}</span>
              <span className="font-bold text-xl text-purple-600">{formatVND(totalSalary)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Clip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-neu-base rounded-3xl shadow-neu-convex p-8 w-full max-w-sm">
            <h3 className="text-xl font-semibold text-gray-700 mb-1">Thêm clip hoàn thành</h3>
            <p className="text-sm text-gray-400 mb-6">
              {selectedDay ? `Ngày ${selectedDay}/${viewMonth}/${viewYear}` : `${getMonthName(viewMonth)} ${viewYear}`}
              {" · "} Clip #{totalClips + 1}
              {" · "} <span className={nextRate === RATE_BONUS ? "text-green-500 font-semibold" : "text-purple-500 font-semibold"}>
                {formatVND(nextRate)}
              </span>
            </p>

            {!selectedDay && (
              <div className="mb-4">
                <label className="text-sm text-gray-500 mb-2 block">Chọn ngày</label>
                <select
                  className="w-full px-4 py-3 rounded-xl shadow-neu-concave bg-neu-base text-gray-700 text-sm border-none outline-none"
                  value={selectedDay || ""}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                >
                  <option value="">-- Chọn ngày --</option>
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}/{viewMonth}/{viewYear}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-6">
              <label className="text-sm text-gray-500 mb-2 block">Tên clip / mô tả</label>
              <input
                type="text"
                value={newClipTitle}
                onChange={(e) => setNewClipTitle(e.target.value)}
                placeholder="VD: Video quảng cáo sản phẩm A"
                className="w-full px-4 py-3 rounded-xl shadow-neu-concave bg-neu-base text-gray-700 placeholder-gray-300 text-sm border-none outline-none focus:ring-2 focus:ring-purple-300"
                onKeyDown={(e) => e.key === "Enter" && handleAddClip()}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddModal(false); setSelectedDay(null); setNewClipTitle(""); }}
                className="flex-1 py-3 rounded-2xl shadow-neu-convex text-gray-500 text-sm font-medium hover:shadow-neu-concave transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAddClip}
                disabled={!newClipTitle.trim() || !selectedDay || isAdding}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-bold bg-gradient-to-r from-purple-500 to-indigo-600 shadow-neu-convex hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? "Đang lưu..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
