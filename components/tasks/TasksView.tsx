"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getTasks, createTask, updateTask, updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import type { Task, TaskStatus, TaskPriority } from "@/types/tasks";
import { Plus, Clock, AlertCircle, CheckCircle2, Trash2, Edit2, Eye, XCircle, RotateCcw } from "lucide-react";

const isOverdue = (deadlineStr: string | null) => {
  if (!deadlineStr) return false;
  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate.getTime() < today.getTime();
};

type ModalMode = 'create' | 'edit' | null;

export default function TasksView() {
  const { activeWorkspaceId } = useWorkspace();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  
  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      if (!activeWorkspaceId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getTasks(activeWorkspaceId);
        setTasks(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [activeWorkspaceId]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    return filtered.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      return isOverdue(t.deadline);
    }).length;

    return { total, inProgress, review, overdue };
  }, [tasks]);

  const openCreateModal = () => {
    setTitle("");
    setAssignee("");
    setDeadline("");
    setPriority("medium");
    setStatus("pending");
    setModalMode('create');
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setAssignee(task.assignee_name || "");
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "");
    setPriority(task.priority);
    setStatus(task.status);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const newTask = await createTask(activeWorkspaceId, {
          title,
          assignee_name: assignee,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          priority,
          status
        });
        setTasks(prev => [...prev, newTask]);
      } else if (modalMode === 'edit' && editingTask) {
        const updated = await updateTask(editingTask.id, {
          title,
          assignee_name: assignee,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          priority,
          status
        });
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
      closeModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("delete_confirm") as string)) return;
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus(id, newStatus);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'review': return 'bg-purple-100 text-purple-600';
      case 'revision': return 'bg-orange-100 text-orange-600';
      case 'completed': return 'bg-green-100 text-green-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityIcon = (p: TaskPriority) => {
    switch (p) {
      case 'low': return <span className="text-gray-400 text-xs">●</span>;
      case 'medium': return <span className="text-blue-400 text-xs">●</span>;
      case 'high': return <span className="text-orange-400 text-xs">●</span>;
      case 'urgent': return <span className="text-red-500 text-xs">●</span>;
    }
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neu-base rounded-[2rem] m-4 shadow-neu-concave p-8">
        <div className="text-gray-500">{t("select_workspace")}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neu-base rounded-[2rem] m-4 shadow-neu-concave p-8">
        <div className="animate-spin text-blue-500"><RotateCcw size={32} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neu-base rounded-[2rem] m-4 shadow-neu-concave p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col m-4 overflow-hidden">
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold text-gray-700 tracking-wide">{t("nav_todo")}</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-full shadow-neu-convex hover:shadow-neu-concave transition-all duration-200"
        >
          <Plus size={18} />
          <span className="text-sm font-medium">{t("task_add")}</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8 px-2">
        <div className="bg-neu-base rounded-3xl p-5 shadow-neu-convex flex flex-col justify-between">
          <div className="text-gray-500 text-sm font-medium">{t("task_total")}</div>
          <div className="text-3xl font-bold text-gray-700 mt-2">{stats.total}</div>
        </div>
        <div className="bg-neu-base rounded-3xl p-5 shadow-neu-convex flex flex-col justify-between">
          <div className="text-gray-500 text-sm font-medium">{t("task_status_in_progress")}</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</div>
        </div>
        <div className="bg-neu-base rounded-3xl p-5 shadow-neu-convex flex flex-col justify-between">
          <div className="text-gray-500 text-sm font-medium">{t("task_status_review")}</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{stats.review}</div>
        </div>
        <div className="bg-neu-base rounded-3xl p-5 shadow-neu-convex flex flex-col justify-between">
          <div className="text-red-400 text-sm font-medium">{t("task_overdue")}</div>
          <div className="text-3xl font-bold text-red-500 mt-2">{stats.overdue}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-6 px-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'in_progress', 'review', 'revision', 'completed', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              statusFilter === s 
                ? 'bg-blue-500 text-white shadow-neu-convex' 
                : 'bg-neu-base text-gray-600 hover:shadow-neu-concave shadow-neu-convex'
            }`}
          >
            {s === 'all' ? "Tất cả" : (t(`task_status_${s}` as any) || s)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-neu-base rounded-[2rem] shadow-neu-concave">
            <CheckCircle2 size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500">{t("task_empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map(task => {
              const isTaskOverdue = isOverdue(task.deadline) && task.status !== 'completed' && task.status !== 'cancelled';
              
              return (
                <div key={task.id} className="bg-neu-base rounded-2xl p-5 shadow-neu-convex hover:shadow-neu-concave transition-all duration-200 group flex items-center justify-between border-l-4 border-transparent hover:border-blue-400">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-neu-base shadow-neu-concave flex items-center justify-center flex-shrink-0">
                      {getPriorityIcon(task.priority)}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-gray-800 font-medium text-lg flex items-center gap-2">
                        {task.title}
                        {isTaskOverdue && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={12} /> {t("task_overdue")}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Eye size={14} className="text-gray-400" />
                          {task.assignee_name || "Chưa giao"}
                        </span>
                        <span className={`flex items-center gap-1 ${isTaskOverdue ? 'text-red-500 font-medium' : ''}`}>
                          <Clock size={14} className={isTaskOverdue ? 'text-red-500' : 'text-gray-400'} />
                          {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : "Không có"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <select 
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                      className={`text-sm px-3 py-1.5 rounded-full font-medium outline-none cursor-pointer appearance-none ${getStatusColor(task.status)}`}
                    >
                      <option value="pending">{t("task_status_pending")}</option>
                      <option value="in_progress">{t("task_status_in_progress")}</option>
                      <option value="review">{t("task_status_review")}</option>
                      <option value="revision">{t("task_status_revision")}</option>
                      <option value="completed">{t("task_status_completed")}</option>
                      <option value="cancelled">{t("task_status_cancelled")}</option>
                    </select>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(task)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        title={t("task_edit")}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(task.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title={t("task_delete")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neu-base rounded-[2rem] w-full max-w-md p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'create' ? t("task_create") : t("task_edit")}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("task_title")}</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Tên công việc..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("task_assignee")}</label>
                <input 
                  type="text" 
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Người phụ trách..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t("task_deadline")}</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{t("task_priority")}</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-600"
                  >
                    <option value="low">{t("task_priority_low")}</option>
                    <option value="medium">{t("task_priority_medium")}</option>
                    <option value="high">{t("task_priority_high")}</option>
                    <option value="urgent">{t("task_priority_urgent")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{t("task_status")}</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none text-gray-600"
                >
                  <option value="pending">{t("task_status_pending")}</option>
                  <option value="in_progress">{t("task_status_in_progress")}</option>
                  <option value="review">{t("task_status_review")}</option>
                  <option value="revision">{t("task_status_revision")}</option>
                  <option value="completed">{t("task_status_completed")}</option>
                  <option value="cancelled">{t("task_status_cancelled")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3 bg-neu-base rounded-xl text-gray-600 font-medium shadow-neu-convex hover:shadow-neu-concave transition-all"
                >
                  {t("task_cancel")}
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-500 rounded-xl text-white font-medium shadow-neu-convex hover:shadow-neu-concave transition-all disabled:opacity-50"
                >
                  {submitting ? t("loading") : t("task_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
