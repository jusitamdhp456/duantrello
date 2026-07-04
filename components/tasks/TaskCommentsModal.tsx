"use client";

import { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getTaskComments, addTaskComment } from "@/app/actions/tasks";
import type { Task, TaskComment } from "@/types/tasks";

interface TaskCommentsModalProps {
  task: Task;
  onClose: () => void;
}

export default function TaskCommentsModal({ task, onClose }: TaskCommentsModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadComments();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${task.id}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [task.id]);

  useEffect(() => {
    // Scroll to bottom when comments change
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadComments = async () => {
    try {
      const data = await getTaskComments(task.id);
      setComments(data as TaskComment[]);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage) return;

    setSubmitting(true);
    let imageUrl = null;

    try {
      // Upload image if selected
      if (selectedImage) {
        setUploading(true);
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${task.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('task_comments')
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('task_comments')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Add comment to DB
      await addTaskComment(task.id, content, imageUrl);
      
      // Reset form
      setContent("");
      removeSelectedImage();
      
      // Reload comments is handled by realtime subscription, but we can do it optimistically or wait.
      // loadComments();
    } catch (error: any) {
      alert("Lỗi khi gửi nhận xét: " + error.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        className="w-full max-w-2xl bg-neu-base rounded-2xl shadow-neu-pressed overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-neu-base shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nhận xét sản phẩm</h2>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p>Chưa có nhận xét nào.</p>
              <p className="text-sm">Hãy là người đầu tiên nhận xét!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-neu-base p-4 rounded-xl shadow-neu-flat">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-700">{comment.user_name || 'Người dùng'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                {comment.content && (
                  <p className="text-gray-600 whitespace-pre-wrap text-sm sm:text-base">{comment.content}</p>
                )}
                {comment.image_url && (
                  <div className="mt-3">
                    <img 
                      src={comment.image_url} 
                      alt="Comment attachment" 
                      className="max-h-64 rounded-lg object-contain border border-gray-100 bg-white"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-neu-base shrink-0">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-20 rounded-md object-cover border border-gray-200" />
              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
              >
                <X size={14} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nhận xét của bạn..."
              className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-400 outline-none resize-none"
              rows={2}
            />
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <ImageIcon size={18} />
                  <span>Đính kèm ảnh</span>
                </button>
              </div>
              
              <button
                type="submit"
                disabled={submitting || (!content.trim() && !selectedImage)}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-medium shadow-lg shadow-purple-200 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Gửi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
