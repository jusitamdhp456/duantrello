"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getPhotoTasks, createPhotoTask, updatePhotoTask, updatePhotoTaskStatus, deletePhotoTask, approvePhotoTaskAndPay, revokePhotoTaskApprovalAndDeduct, claimPhotoTask, unclaimPhotoTask } from "@/app/actions/photo_tasks";
import type { PhotoTask, PhotoTaskStatus, PhotoTaskPriority } from "@/types/photo_tasks";
import { Plus, Clock, AlertCircle, CheckCircle2, Trash2, Edit2, Eye, XCircle, RotateCcw, Link2, CheckSquare, Hand, MessageCircle, Image as ImageIcon, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PhotoTaskCommentsModal from "@/components/photo-tasks/PhotoTaskCommentsModal";

const isOverdue = (deadlineStr: string | null | undefined) => {
  if (!deadlineStr) return false;
  const deadlineDate = new Date(deadlineStr);
  deadlineDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineDate.getTime() < today.getTime();
};

type ModalMode = 'create' | 'edit' | null;

export default function PhotoTasksView() {
  const { activeWorkspaceId } = useWorkspace();
  const { t } = useLanguage();

  const [tasks, setTasks] = useState<PhotoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string, email: string } | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, email: user.email || "" });
      }
    }
    loadUser();
  }, [supabase.auth]);

  const isAdmin = currentUser?.email === 'jusitamd999@gmail.com';
  const canReview = isAdmin || currentUser?.email === 'haphuongta@gmail.com';
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<PhotoTaskStatus | 'all'>('all');
  
  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTask, setEditingTask] = useState<PhotoTask | null>(null);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<PhotoTask | null>(null);
  const [reviewConfirm, setReviewConfirm] = useState<{
    task: PhotoTask;
    action: 'approved' | 'rejected';
    message: string;
  } | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<PhotoTaskPriority>("medium");
  const [status, setStatus] = useState<PhotoTaskStatus>("pending");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUrl2, setVideoUrl2] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Image upload state
  const [imageFile1, setImageFile1] = useState<File | null>(null);
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [imagePreview1, setImagePreview1] = useState<string | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadTasks() {
      if (!activeWorkspaceId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getPhotoTasks(activeWorkspaceId);
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
    } else {
      filtered = filtered.filter(t => t.review_status !== 'approved');
    }
    return filtered.sort((a, b) => {
      const aHasProduct = !!a.product_url;
      const bHasProduct = !!b.product_url;
      if (aHasProduct && !bHasProduct) return -1;
      if (!aHasProduct && bHasProduct) return 1;

      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [tasks, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.filter(t => t.review_status !== 'approved').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    return { total, inProgress, review, completed };
  }, [tasks]);

  const openCreateModal = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("medium");
    setStatus("pending");
    setVideoUrl("");
    setVideoUrl2("");
    setProductUrl("");
    setImageFile1(null);
    setImageFile2(null);
    setImagePreview1(null);
    setImagePreview2(null);
    setModalMode('create');
  };

  const openEditModal = (task: PhotoTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "");
    setPriority(task.priority);
    setStatus(task.status);
    setVideoUrl(task.video_url || "");
    setVideoUrl2(task.video_url_2 || "");
    setProductUrl(task.product_url || "");
    setImageFile1(null);
    setImageFile2(null);
    setImagePreview1(task.video_url || null);
    setImagePreview2(task.video_url_2 || null);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTask(null);
    setImageFile1(null);
    setImageFile2(null);
    setImagePreview1(null);
    setImagePreview2(null);
  };

  const handleImageSelect = (file: File, slot: 1 | 2) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (slot === 1) {
        setImageFile1(file);
        setImagePreview1(reader.result as string);
      } else {
        setImageFile2(file);
        setImagePreview2(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (slot: 1 | 2) => {
    if (slot === 1) {
      setImageFile1(null);
      setImagePreview1(null);
      setVideoUrl("");
      if (fileInput1Ref.current) fileInput1Ref.current.value = '';
    } else {
      setImageFile2(null);
      setImagePreview2(null);
      setVideoUrl2("");
      if (fileInput2Ref.current) fileInput2Ref.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `photo_tasks/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task_comments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('task_comments')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    try {
      setSubmitting(true);
      setUploading(true);

      // Upload images if selected
      let finalVideoUrl = videoUrl;
      let finalVideoUrl2 = videoUrl2;

      if (imageFile1) {
        finalVideoUrl = await uploadImage(imageFile1);
      }
      if (imageFile2) {
        finalVideoUrl2 = await uploadImage(imageFile2);
      }

      if (modalMode === 'create') {
        const newTask = await createPhotoTask(activeWorkspaceId, {
          title,
          description: description || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          priority,
          status,
          video_url: finalVideoUrl || null,
          video_url_2: finalVideoUrl2 || null,
          product_url: productUrl || null,
        });
        setTasks(prev => [...prev, newTask]);
      } else if (modalMode === 'edit' && editingTask) {
        const updated = await updatePhotoTask(editingTask.id, {
          title,
          description: description || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          priority,
          status,
          video_url: finalVideoUrl || null,
          video_url_2: finalVideoUrl2 || null,
          product_url: productUrl || null,
        });
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
      closeModal();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("delete_confirm") as string)) return;
    try {
      await deletePhotoTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PhotoTaskStatus) => {
    try {
      await updatePhotoTaskStatus(id, newStatus);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClaimTask = async (id: string) => {
    try {
      const res = await claimPhotoTask(id);
      if (res && res.error) {
        alert("Lỗi: " + res.error);
        return;
      }
      if (activeWorkspaceId) {
        const data = await getPhotoTasks(activeWorkspaceId);
        setTasks(data);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnclaimTask = async (id: string) => {
    try {
      const res = await unclaimPhotoTask(id);
      if (res && res.error) {
        alert("Lỗi: " + res.error);
        return;
      }
      if (activeWorkspaceId) {
        const data = await getPhotoTasks(activeWorkspaceId);
        setTasks(data);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitProductUrl = async (task: PhotoTask) => {
    const url = window.prompt("Nhập link ảnh hoàn thành (Google Drive...):", task.product_url || "");
    if (url === null) return;
    
    try {
      const trimmedUrl = url.trim();
      const updates: any = { product_url: trimmedUrl || null };
      
      if (trimmedUrl) {
        updates.status = 'review';
      }
      
      await updatePhotoTask(task.id, updates);
      setTasks(prev => prev.map(t => t.id === task.id ? { 
        ...t, 
        product_url: trimmedUrl || null,
        ...(trimmedUrl ? { status: 'review' } : {})
      } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReviewAction = (task: PhotoTask, action: 'approved' | 'rejected') => {
    if (!activeWorkspaceId) return;
    
    if (action === 'approved' && task.review_status !== 'approved') {
      setReviewConfirm({ task, action, message: "Bạn có chắc chắn muốn duyệt và tính lương cho ảnh này?" });
    } else if (action === 'rejected' && task.review_status === 'approved') {
      setReviewConfirm({ task, action, message: "Bạn có chắc chắn muốn HỦY duyệt? Tiền lương của ảnh này sẽ bị trừ đi." });
    } else if (action === 'rejected' && task.review_status !== 'approved') {
      executeReviewAction(task, action);
    }
  };

  const executeReviewAction = async (task: PhotoTask, action: 'approved' | 'rejected') => {
    if (!activeWorkspaceId) return;
    
    if (action === 'approved' && task.review_status !== 'approved') {
      try {
        const res = await approvePhotoTaskAndPay(task.id, activeWorkspaceId, task.title);
        if (res && res.error) {
          alert("Lỗi: " + res.error);
          return;
        }
        setSuccessAlert(`Đã duyệt! Em làm tốt lắm`);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, review_status: 'approved' } : t));
      } catch (err: any) {
        alert(err.message);
      }
    } else if (action === 'rejected' && task.review_status === 'approved') {
      try {
        const res = await revokePhotoTaskApprovalAndDeduct(task.id, task.title);
        if (res && res.error) {
          alert("Lỗi: " + res.error);
          return;
        }
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, review_status: 'rejected' } : t));
      } catch (err: any) {
        alert(err.message);
      }
    } else if (action === 'rejected' && task.review_status !== 'approved') {
      try {
        await updatePhotoTask(task.id, { review_status: 'rejected' });
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, review_status: 'rejected' } : t));
      } catch (err: any) {
        alert(err.message);
      }
    }
    setReviewConfirm(null);
  };

  const getStatusColor = (s: PhotoTaskStatus) => {
    switch (s) {
      case 'pending': return 'bg-blue-900/50 text-blue-200';
      case 'in_progress': return 'bg-sky-700/50 text-sky-200';
      case 'review': return 'bg-indigo-700/50 text-indigo-200';
      case 'revision': return 'bg-orange-800/50 text-orange-300';
      case 'completed': return 'bg-green-800/50 text-green-300';
      case 'cancelled': return 'bg-red-900/50 text-red-300';
      default: return 'bg-blue-900/50 text-blue-200';
    }
  };

  const getPriorityIcon = (p: PhotoTaskPriority) => {
    switch (p) {
      case 'low': return <span className="text-gray-400 text-xs">●</span>;
      case 'medium': return <span className="text-purple-400 text-xs">●</span>;
      case 'high': return <span className="text-orange-400 text-xs">●</span>;
      case 'urgent': return <span className="text-red-500 text-xs">●</span>;
    }
  };

  if (!activeWorkspaceId) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-[2rem] m-4 p-8" style={{background: 'rgba(13,38,87,0.7)', boxShadow: 'inset 3px 3px 8px rgba(8,23,64,0.5)'}}>
        <div className="text-blue-300">{t("select_workspace")}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-[2rem] m-4 p-8" style={{background: 'rgba(13,38,87,0.7)', boxShadow: 'inset 3px 3px 8px rgba(8,23,64,0.5)'}}>
        <div className="animate-spin text-sky-400"><RotateCcw size={32} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-[2rem] m-4 p-8" style={{background: 'rgba(13,38,87,0.7)', boxShadow: 'inset 3px 3px 8px rgba(8,23,64,0.5)'}}>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col m-4 overflow-hidden">
      <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mb-4 sm:mb-6 px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-sky-100 tracking-wide truncate">{t("nav_photo_todo" as any) || "Ảnh cần làm"}</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-white rounded-full transition-all duration-200 shrink-0"
          style={{background: 'linear-gradient(135deg, #2B91CE, #1A5CB0)', boxShadow: '0 4px 15px rgba(43,145,206,0.4)'}}
        >
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{t("task_add")}</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 md:gap-6 mb-4 sm:mb-8 px-1 sm:px-2">
        <div className="rounded-xl sm:rounded-3xl p-1.5 sm:p-4 md:p-5 flex flex-col justify-between min-w-0" style={{background: 'linear-gradient(135deg, #0D2657, #0D3E8A)', boxShadow: '2px 2px 6px rgba(8,23,64,0.5), -1px -1px 4px rgba(30,70,140,0.3)'}}>
          <div className="text-blue-300 text-[8px] sm:text-xs md:text-sm font-medium truncate min-w-0 w-full">{t("task_total")}</div>
          <div className="text-sm sm:text-2xl md:text-3xl font-bold text-sky-100 mt-0.5 sm:mt-2 truncate min-w-0">{stats.total}</div>
        </div>
        <div className="rounded-xl sm:rounded-3xl p-1.5 sm:p-4 md:p-5 flex flex-col justify-between min-w-0" style={{background: 'linear-gradient(135deg, #0D2657, #0D3E8A)', boxShadow: '2px 2px 6px rgba(8,23,64,0.5), -1px -1px 4px rgba(30,70,140,0.3)'}}>
          <div className="text-blue-300 text-[8px] sm:text-xs md:text-sm font-medium truncate min-w-0 w-full">{t("task_status_in_progress")}</div>
          <div className="text-sm sm:text-2xl md:text-3xl font-bold text-sky-300 mt-0.5 sm:mt-2 truncate min-w-0">{stats.inProgress}</div>
        </div>
        <div className="rounded-xl sm:rounded-3xl p-1.5 sm:p-4 md:p-5 flex flex-col justify-between min-w-0" style={{background: 'linear-gradient(135deg, #0D2657, #0D3E8A)', boxShadow: '2px 2px 6px rgba(8,23,64,0.5), -1px -1px 4px rgba(30,70,140,0.3)'}}>
          <div className="text-blue-300 text-[8px] sm:text-xs md:text-sm font-medium truncate min-w-0 w-full">{t("task_status_review")}</div>
          <div className="text-sm sm:text-2xl md:text-3xl font-bold text-sky-300 mt-0.5 sm:mt-2 truncate min-w-0">{stats.review}</div>
        </div>
        <div className="rounded-xl sm:rounded-3xl p-1.5 sm:p-4 md:p-5 flex flex-col justify-between min-w-0" style={{background: 'linear-gradient(135deg, #0D2657, #0D3E8A)', boxShadow: '2px 2px 6px rgba(8,23,64,0.5), -1px -1px 4px rgba(30,70,140,0.3)'}}>
          <div className="text-green-400 text-[8px] sm:text-xs md:text-sm font-medium truncate min-w-0 w-full">{t("task_status_completed")}</div>
          <div className="text-sm sm:text-2xl md:text-3xl font-bold text-green-400 mt-0.5 sm:mt-2 truncate min-w-0">{stats.completed}</div>
        </div>
      </div>

      <div className="flex gap-2 md:gap-3 mb-6 px-2 overflow-x-auto pb-3 snap-x scrollbar-hide">
        {(['all', 'pending', 'in_progress', 'review', 'revision', 'completed', 'cancelled'] as const).map(s => {
          const count = s === 'all' 
            ? tasks.filter(t => t.review_status !== 'approved').length 
            : tasks.filter(t => t.status === s).length;
          return (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 border`}
            style={statusFilter === s ? {
              background: 'linear-gradient(135deg, #2B91CE, #1A5CB0)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(43,145,206,0.4)',
              borderColor: 'rgba(44,145,206,0.3)'
            } : {
              background: 'rgba(13,38,87,0.6)',
              color: '#93C5E8',
              borderColor: 'rgba(44,116,177,0.3)'
            }}
          >
            {s === 'all' ? "Tất cả" : (t(`task_status_${s}` as any) || s)}
            {statusFilter === s ? ` (${count})` : ''}
          </button>
        )})}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-[2rem]" style={{background: 'rgba(13,38,87,0.6)', boxShadow: 'inset 3px 3px 8px rgba(8,23,64,0.5)'}}>
            <CheckCircle2 size={48} className="text-blue-700 mb-4" />
            <p className="text-blue-400">{t("task_empty")}</p>
          </div>
        ) : (
          <div className="grid gap-1.5 sm:gap-3">
            {filteredTasks.map(task => {
              const isTaskOverdue = isOverdue(task.deadline) && task.status !== 'completed' && task.status !== 'cancelled';
              
              return (
                <div key={task.id} 
                  className="min-w-0 rounded-[1rem] md:rounded-[1.2rem] py-2 px-2.5 md:py-3 md:px-4 hover:-translate-y-1 transition-all duration-300 group flex flex-col lg:flex-row items-start lg:items-center justify-between gap-1.5 md:gap-3"
                  style={{
                    background: task.assignee_id 
                      ? 'linear-gradient(135deg, #0D2657 0%, #0D3E8A 100%)' 
                      : 'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)',
                    boxShadow: task.assignee_id 
                      ? '2px 2px 8px rgba(8,23,64,0.5), -1px -1px 4px rgba(30,70,140,0.3)'
                      : '2px 2px 8px rgba(8,23,64,0.5), -1px -1px 4px rgba(76,29,149,0.3)',
                    border: task.assignee_id ? 'none' : '1px solid rgba(139,92,246,0.3)',
                    borderLeft: `3px solid ${isTaskOverdue ? '#f87171' : (task.assignee_id ? 'rgba(44,145,206,0.6)' : 'rgba(167,139,250,0.6)')}`
                  }}
                >
                  <div className="flex items-start md:items-center gap-2 sm:gap-3 flex-1 w-full lg:w-auto overflow-hidden min-w-0">
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0" style={{background: 'rgba(13,38,87,0.8)', boxShadow: 'inset 2px 2px 4px rgba(8,23,64,0.6), inset -2px -2px 4px rgba(30,70,140,0.3)'}}>
                      {getPriorityIcon(task.priority)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3 className="text-white font-semibold text-[13px] sm:text-base flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="truncate min-w-0 max-w-full">{task.title}</span>
                        {isTaskOverdue && (
                          <span className="text-[8px] sm:text-[10px] bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 border border-red-500/40">
                            <AlertCircle size={10} /> {t("task_overdue")}
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-white/60 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Eye size={10} className="text-white/40 sm:w-3 sm:h-3" />
                          <span className="truncate max-w-[90px] sm:max-w-none">{task.assignee_name || "Chưa nhận"}</span>
                        </span>
                        {task.description && (
                          <span className="flex items-center gap-1 text-white/50 italic">
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">{task.description}</span>
                          </span>
                        )}
                        <span className={`flex items-center gap-1 ${isTaskOverdue ? 'text-red-300 font-medium' : ''}`}>
                          <Clock size={10} className={`sm:w-3 sm:h-3 ${isTaskOverdue ? 'text-red-300' : 'text-white/40'}`} />
                          {task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : "Không có"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-end gap-1.5 w-full lg:w-auto pt-1.5 lg:pt-0 border-t border-blue-700/30 lg:border-t-0 mt-0.5 lg:mt-0 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 justify-start sm:justify-end w-full lg:w-auto min-w-0">
                      {task.video_url && (
                        <a 
                          href={task.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap transition-all hover:opacity-90 flex items-center gap-1"
                          style={{background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)'}}
                        >
                          <ImageIcon size={10} className="sm:w-3 sm:h-3" />
                          Ảnh 1
                        </a>
                      )}

                      {task.video_url_2 && (
                        <a 
                          href={task.video_url_2} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap transition-all hover:opacity-90 flex items-center gap-1"
                          style={{background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)'}}
                        >
                          <ImageIcon size={10} className="sm:w-3 sm:h-3" />
                          Ảnh 2
                        </a>
                      )}

                      <button
                        onClick={() => setSelectedTaskForComments(task)}
                        className="flex items-center gap-1 text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap transition-all hover:opacity-90"
                        style={{background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.18)'}}
                      >
                        <MessageCircle size={10} className="sm:w-3 sm:h-3" />
                        Nhận xét
                      </button>
                      
                      {task.product_url ? (
                        <div className="flex items-center gap-0.5">
                          <a 
                            href={task.product_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap transition-all hover:opacity-90"
                            style={{background: 'rgba(34,197,94,0.2)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)'}}
                          >
                            <Link2 size={10} className="sm:w-3 sm:h-3" />
                            SP hoàn thành
                          </a>
                          {(isAdmin || task.assignee_id === currentUser?.id) && (
                            <button
                              onClick={() => handleSubmitProductUrl(task)}
                              className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                              title="Sửa link sản phẩm"
                            >
                              <Edit2 size={10} className="sm:w-3 sm:h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        (isAdmin || task.assignee_id === currentUser?.id) && (
                          <button
                            onClick={() => handleSubmitProductUrl(task)}
                            className="flex items-center gap-1 text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap transition-all hover:opacity-90 border border-dashed"
                            style={{background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.2)'}}
                          >
                            <Plus size={10} className="sm:w-3 sm:h-3" />
                            Nộp SP
                          </button>
                        )
                      )}

                      <select 
                        value={task.status}
                        disabled={!isAdmin && task.assignee_id !== currentUser?.id}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as PhotoTaskStatus)}
                        className={`text-[9px] sm:text-xs px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-medium outline-none cursor-pointer appearance-none flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">{t("task_status_pending")}</option>
                        <option value="in_progress">{t("task_status_in_progress")}</option>
                        <option value="review">{t("task_status_review")}</option>
                        <option value="revision">{t("task_status_revision")}</option>
                        <option value="completed">{t("task_status_completed")}</option>
                        <option value="cancelled">{t("task_status_cancelled")}</option>
                      </select>

                      <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {(isAdmin || task.assignee_id === currentUser?.id) && (
                          <button 
                            onClick={() => openEditModal(task)}
                            className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title={t("task_edit")}
                          >
                            <Edit2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                          </button>
                        )}
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(task.id)}
                            className="p-1 text-white/40 hover:text-red-400 hover:bg-red-500/20 rounded-full transition-colors"
                            title={t("task_delete")}
                          >
                            <Trash2 size={12} className="sm:w-[14px] sm:h-[14px]" />
                          </button>
                        )}
                        {!isAdmin && !task.assignee_id && (
                          <button
                            onClick={() => handleClaimTask(task.id)}
                            className="flex items-center gap-1 px-1.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-white rounded-full transition-colors shadow-sm"
                            style={{background: 'linear-gradient(135deg, #2B91CE, #1A5CB0)', boxShadow: '0 2px 8px rgba(43,145,206,0.4)'}}
                            title="Nhận việc"
                          >
                            <Hand size={10} className="sm:w-3 sm:h-3" /> Nhận việc
                          </button>
                        )}
                        {task.assignee_id === currentUser?.id && (
                          <button
                            onClick={() => handleUnclaimTask(task.id)}
                            className="flex items-center gap-1 px-1.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-white/70 rounded-full transition-all hover:text-red-300 hover:bg-red-500/20 shadow-sm border"
                            style={{background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)'}}
                            title="Bỏ nhận việc"
                          >
                            <XCircle size={10} className="sm:w-3 sm:h-3" /> Bỏ nhận
                          </button>
                        )}
                      </div>
                    </div>

                    {task.product_url && (
                      <div className="flex items-center gap-1 p-0.5 rounded-xl border lg:mr-[60px] w-full sm:w-auto mt-0.5" style={{background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)'}}>
                        <button
                          onClick={() => canReview && task.review_status !== 'approved' && handleReviewAction(task, 'approved')}
                          disabled={!canReview}
                          className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1 px-1.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded-lg transition-all duration-300 ${
                            task.review_status === 'approved' 
                              ? 'bg-green-500 text-white shadow-sm scale-100' 
                              : `text-white/40 scale-95 ${canReview ? 'hover:text-green-400 hover:bg-green-500/20' : ''}`
                          } ${!canReview ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-0.5">
                            <CheckSquare size={10} className="sm:w-3 sm:h-3" />
                            Đã duyệt
                          </div>
                          {task.review_status === 'approved' && (
                            <span className="text-[8px] sm:text-[9px] font-normal opacity-90 block sm:inline">
                              ({new Date(task.updated_at).toLocaleDateString('vi-VN')})
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => canReview && task.review_status !== 'rejected' && handleReviewAction(task, 'rejected')}
                          disabled={!canReview}
                          className={`flex-1 sm:flex-none flex flex-col sm:flex-row items-center justify-center gap-1 px-1.5 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold rounded-lg transition-all duration-300 ${
                            task.review_status !== 'approved' 
                              ? 'bg-red-500 text-white shadow-sm scale-100' 
                              : `text-white/40 scale-95 ${canReview ? 'hover:text-red-400 hover:bg-red-500/20' : ''}`
                          } ${!canReview ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-0.5">
                            <XCircle size={10} className="sm:w-3 sm:h-3" />
                            Chưa duyệt
                          </div>
                          {task.review_status === 'rejected' && (
                            <span className="text-[8px] sm:text-[9px] font-normal opacity-90 block sm:inline">
                              ({new Date(task.updated_at).toLocaleDateString('vi-VN')})
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-[2rem] w-full max-w-md p-6 border border-white/10" style={{background: 'linear-gradient(135deg, #0D2657 0%, #0A1E45 100%)', boxShadow: '0 25px 60px rgba(8,23,64,0.7)'}}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'create' ? t("task_create") : t("task_edit")}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">{t("task_title")}</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
                  style={{background: 'rgba(255,255,255,0.08)'}}
                  placeholder="Tên công việc..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Mô tả công việc</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed border border-white/10 resize-none"
                  style={{background: 'rgba(255,255,255,0.08)'}}
                  placeholder="Mô tả chi tiết công việc..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">{t("task_deadline")}</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
                    style={{background: 'rgba(255,255,255,0.08)', colorScheme: 'dark'}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">{t("task_priority")}</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PhotoTaskPriority)}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-400 outline-none disabled:opacity-70 disabled:cursor-not-allowed border border-white/10"
                    style={{background: '#0D2A6B'}}
                  >
                    <option value="low">{t("task_priority_low")}</option>
                    <option value="medium">{t("task_priority_medium")}</option>
                    <option value="high">{t("task_priority_high")}</option>
                    <option value="urgent">{t("task_priority_urgent")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">{t("task_status")}</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PhotoTaskStatus)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-sky-400 outline-none border border-white/10"
                  style={{background: '#0D2A6B'}}
                >
                  <option value="pending">{t("task_status_pending")}</option>
                  <option value="in_progress">{t("task_status_in_progress")}</option>
                  <option value="review">{t("task_status_review")}</option>
                  <option value="revision">{t("task_status_revision")}</option>
                  <option value="completed">{t("task_status_completed")}</option>
                  <option value="cancelled">{t("task_status_cancelled")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Ảnh tham khảo 1</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInput1Ref}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file, 1);
                  }}
                />
                {imagePreview1 ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10" style={{background: 'rgba(255,255,255,0.05)'}}>
                    <img src={imagePreview1} alt="Ảnh 1" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(1)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput1Ref.current?.click()}
                    className="w-full rounded-xl px-4 py-6 text-sm text-white/50 border border-dashed border-white/20 flex flex-col items-center gap-2 hover:border-sky-400/50 hover:text-sky-300 transition-all"
                    style={{background: 'rgba(255,255,255,0.03)'}}
                  >
                    <Upload size={24} />
                    <span>Bấm để chọn ảnh</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Ảnh tham khảo 2</label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInput2Ref}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file, 2);
                  }}
                />
                {imagePreview2 ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10" style={{background: 'rgba(255,255,255,0.05)'}}>
                    <img src={imagePreview2} alt="Ảnh 2" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(2)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInput2Ref.current?.click()}
                    className="w-full rounded-xl px-4 py-6 text-sm text-white/50 border border-dashed border-white/20 flex flex-col items-center gap-2 hover:border-sky-400/50 hover:text-sky-300 transition-all"
                    style={{background: 'rgba(255,255,255,0.03)'}}
                  >
                    <Upload size={24} />
                    <span>Bấm để chọn ảnh</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Link sản phẩm hoàn thành</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:ring-2 focus:ring-sky-400 outline-none border border-white/10"
                    style={{background: 'rgba(255,255,255,0.08)'}}
                    placeholder="https://... (Link Google Drive...)"
                  />
                  {productUrl && (
                    <a 
                      href={productUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center whitespace-nowrap text-sm text-white hover:opacity-90"
                      style={{background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)'}}
                      title="Mở link sản phẩm"
                    >
                      Mở link
                    </a>
                  )}
                </div>
                <p className="text-xs text-white/30 mt-2">
                  * Khi điền link sản phẩm, quản lý có thể duyệt để tự động tính lương.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl text-white/70 font-medium transition-all hover:text-white border border-white/10"
                  style={{background: 'rgba(255,255,255,0.07)'}}
                >
                  {t("task_cancel")}
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-white font-medium transition-all disabled:opacity-50"
                  style={{background: 'linear-gradient(135deg, #2B91CE, #1A5CB0)', boxShadow: '0 4px 15px rgba(43,145,206,0.4)'}}
                >
                  {submitting ? t("loading") : t("task_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTaskForComments && (
        <PhotoTaskCommentsModal 
          task={selectedTaskForComments} 
          onClose={() => setSelectedTaskForComments(null)} 
        />
      )}

      {reviewConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0D2657] border border-blue-500/30 p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            style={{boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'}}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-600"></div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Xác nhận</h3>
            <p className="text-blue-100/80 mb-8 text-sm leading-relaxed">{reviewConfirm.message}</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setReviewConfirm(null)}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-medium"
              >
                Hủy
              </button>
              <button 
                onClick={() => executeReviewAction(reviewConfirm.task, reviewConfirm.action)}
                className="flex-1 px-6 py-3 rounded-xl text-white transition-all font-medium"
                style={{
                  background: reviewConfirm.action === 'approved' ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #DC2626, #B91C1C)',
                  boxShadow: reviewConfirm.action === 'approved' ? '0 4px 15px rgba(5,150,105,0.4)' : '0 4px 15px rgba(220,38,38,0.4)'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {successAlert && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0D2657] border border-green-500/30 p-6 sm:p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            style={{boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'}}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
            <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Thành công!</h3>
            <p className="text-green-100/80 mb-8 text-sm leading-relaxed">{successAlert}</p>
            <button 
              onClick={() => setSuccessAlert(null)}
              className="w-full py-3 rounded-xl text-white transition-all font-medium"
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                boxShadow: '0 4px 15px rgba(5,150,105,0.4)'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
