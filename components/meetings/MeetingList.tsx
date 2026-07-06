"use client";

import { useState, useMemo } from "react";
import { Plus, Video, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import MeetingCard from "@/components/meetings/MeetingCard";
import CreateMeetingModal from "@/components/meetings/CreateMeetingModal";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { createMeeting, deleteMeeting } from "@/app/actions/meetings";
import type { Meeting, MeetingType, AgendaItem } from "@/app/actions/meetings";

type FilterTab = "all" | "scheduled" | "ongoing" | "ended";

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Tất cả", icon: <Video size={14} /> },
  { key: "scheduled", label: "Sắp tới", icon: <Calendar size={14} /> },
  { key: "ongoing", label: "Đang họp", icon: <Clock size={14} /> },
  { key: "ended", label: "Đã kết thúc", icon: <CheckCircle2 size={14} /> },
];

interface Props {
  initialMeetings: Meeting[];
}

export default function MeetingList({ initialMeetings }: Props) {
  const { activeWorkspaceId, activeRole } = useWorkspace();
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showCreate, setShowCreate] = useState(false);

  const stats = useMemo(() => ({
    total: meetings.length,
    ongoing: meetings.filter((m) => m.status === "ongoing").length,
    scheduled: meetings.filter((m) => m.status === "scheduled").length,
    ended: meetings.filter((m) => m.status === "ended").length,
  }), [meetings]);

  const filteredMeetings = useMemo(() => {
    if (filter === "all") return meetings;
    return meetings.filter((m) => m.status === filter);
  }, [meetings, filter]);

  const handleCreate = async (payload: {
    title: string;
    description?: string;
    type: MeetingType;
    meet_link?: string;
    scheduled_at?: string;
    agenda?: AgendaItem[];
  }) => {
    if (!activeWorkspaceId) throw new Error("Vui lòng chọn workspace trước");
    const result = await createMeeting(activeWorkspaceId, payload);
    if (result.error) throw new Error(result.error);
    if (result.data) setMeetings((prev) => [result.data!, ...prev]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa cuộc họp này?")) return;
    const result = await deleteMeeting(id);
    if (result.error) {
      alert("Lỗi: " + result.error);
      return;
    }
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neu-base rounded-[2rem] m-4 shadow-neu-concave p-8">
        <div className="text-gray-400">Vui lòng chọn workspace trước.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 tracking-wide flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Video size={18} className="text-white" />
            </div>
            Meetings
          </h1>
          <p className="text-sm text-gray-400 mt-1 ml-12">Lên lịch, ghi chú và theo dõi cuộc họp của team</p>
        </div>
        {activeRole !== 'guest' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all duration-200 text-sm font-semibold"
          >
            <Plus size={18} />
            Tạo cuộc họp
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng cuộc họp", value: stats.total, color: "text-gray-700", bg: "from-gray-50 to-slate-50" },
          { label: "Đang diễn ra", value: stats.ongoing, color: "text-red-500", bg: "from-red-50 to-rose-50" },
          { label: "Sắp tới", value: stats.scheduled, color: "text-blue-500", bg: "from-blue-50 to-indigo-50" },
          { label: "Đã kết thúc", value: stats.ended, color: "text-green-500", bg: "from-green-50 to-emerald-50" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.bg} rounded-2xl p-5 shadow-neu-convex`}>
            <div className="text-xs text-gray-400 font-medium mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              filter === tab.key
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-neu-base text-gray-500 shadow-neu-convex hover:shadow-neu-concave"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key !== "all" && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {meetings.filter((m) => m.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Meeting grid */}
      {filteredMeetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-neu-base rounded-[2rem] shadow-neu-concave">
          <Video size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Không có cuộc họp nào</p>
          <p className="text-gray-300 text-sm mt-1">
            {filter === "all" ? "Nhấn \"Tạo cuộc họp\" để bắt đầu" : `Không có cuộc họp ở trạng thái này`}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} /> Tạo cuộc họp đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 pb-6">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateMeetingModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
