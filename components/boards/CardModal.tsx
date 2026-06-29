"use client";

import { X, CheckSquare, MessageSquare, Tag, Paperclip, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { updateCardDetails, createChecklist, createChecklistItem, toggleChecklistItem, addComment } from "@/app/actions/boards";

interface CardModalProps {
  card: any;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: CardModalProps) {
  const { t } = useLanguage();
  const supabase = createClient();
  
  const [description, setDescription] = useState(card.description || "");
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  
  const [checklists, setChecklists] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchCardDetails();
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [card.id]);

  async function fetchCardDetails() {
    setIsLoading(true);
    
    // Fetch checklists
    const { data: clData } = await supabase
      .from('card_checklists')
      .select('*, card_checklist_items(*)')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true });
      
    if (clData) setChecklists(clData);

    // Fetch comments
    const { data: commentsData } = await supabase
      .from('card_comments')
      .select('*, profiles(full_name, email)')
      .eq('card_id', card.id)
      .order('created_at', { ascending: false });

    if (commentsData) setComments(commentsData);
    
    setIsLoading(false);
  }

  const handleSaveDescription = async () => {
    setIsSavingDesc(true);
    try {
      await updateCardDetails(card.id, { description });
      // optionally show success
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsCommenting(true);
    try {
      const added = await addComment(card.id, newComment);
      setComments([added, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleAddChecklist = async () => {
    const title = prompt("Checklist Title:");
    if (!title) return;
    try {
      const added = await createChecklist(card.id, title);
      setChecklists([...checklists, { ...added, card_checklist_items: [] }]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const content = prompt("Task description:");
    if (!content) return;
    try {
      const added = await createChecklistItem(checklistId, content);
      setChecklists(checklists.map(cl => {
        if (cl.id === checklistId) {
          return { ...cl, card_checklist_items: [...cl.card_checklist_items, added] };
        }
        return cl;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleItem = async (checklistId: string, itemId: string, isCompleted: boolean) => {
    try {
      await toggleChecklistItem(itemId, isCompleted);
      setChecklists(checklists.map(cl => {
        if (cl.id === checklistId) {
          return {
            ...cl,
            card_checklist_items: cl.card_checklist_items.map((item: any) => 
              item.id === itemId ? { ...item, is_completed: isCompleted } : item
            )
          };
        }
        return cl;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-neu-base/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      <div className="relative bg-neu-base rounded-[2.5rem] shadow-neu-convex w-full max-w-3xl max-h-[90vh] flex flex-col z-10 overflow-hidden border-none">
        
        <div className="flex items-center justify-between p-8 bg-neu-base border-b border-gray-200/20">
          <h2 className="text-2xl font-bold text-gray-700 tracking-wide">{card.title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:shadow-neu-concave transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-10">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-gray-600 mb-4 tracking-wide uppercase flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" /> {t("description")}
                  </h3>
                  <textarea 
                    className="w-full bg-neu-base shadow-neu-concave rounded-2xl p-4 text-sm focus:outline-none text-gray-700 font-medium min-h-[120px] resize-none border-none placeholder-gray-400"
                    placeholder={t("add_detailed_desc")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex justify-end mt-4">
                    <button 
                      onClick={handleSaveDescription}
                      disabled={isSavingDesc}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave active:shadow-neu-pressed transition-all disabled:opacity-50 flex items-center"
                    >
                      {isSavingDesc && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                      {t("save")}
                    </button>
                  </div>
                </div>

                {/* Checklists */}
                {checklists.map((cl) => (
                  <div key={cl.id} className="bg-neu-base shadow-neu-convex rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-600 tracking-wide uppercase flex items-center">
                        <CheckSquare className="w-4 h-4 mr-2" /> {cl.title}
                      </h3>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {cl.card_checklist_items?.sort((a: any, b: any) => a.position - b.position).map((item: any) => (
                        <div key={item.id} className="flex items-center p-3 bg-neu-base shadow-neu-concave rounded-xl">
                          <input 
                            type="checkbox" 
                            checked={item.is_completed}
                            onChange={(e) => handleToggleItem(cl.id, item.id, e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded mr-3 bg-neu-base border-none shadow-neu-convex"
                          />
                          <span className={`text-sm font-medium ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.content}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => handleAddChecklistItem(cl.id)}
                      className="text-xs text-gray-500 font-bold uppercase tracking-wider hover:text-indigo-500 transition-colors bg-neu-base shadow-neu-convex hover:shadow-neu-concave px-4 py-2 rounded-lg"
                    >
                      + Add Item
                    </button>
                  </div>
                ))}

                {/* Activity / Comments */}
                <div>
                  <h3 className="text-sm font-bold text-gray-600 mb-4 tracking-wide uppercase flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" /> {t("activity")}
                  </h3>
                  <form onSubmit={handleAddComment} className="flex items-start space-x-4 mb-8 bg-neu-base shadow-neu-convex p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-neu-base shadow-neu-concave flex-shrink-0 flex items-center justify-center font-bold text-indigo-500">
                      You
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t("write_comment")}
                        className="w-full bg-neu-base shadow-neu-concave border-none rounded-xl p-3 text-sm focus:outline-none text-gray-700 font-medium placeholder-gray-400 mb-3"
                      />
                      <button 
                        type="submit"
                        disabled={isCommenting}
                        className="bg-neu-base text-gray-600 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave transition-all disabled:opacity-50"
                      >
                        {isCommenting ? "..." : t("save")}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-neu-base shadow-neu-convex flex-shrink-0 flex items-center justify-center font-bold text-gray-500 text-xs">
                          {(comment.profiles?.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 bg-neu-base shadow-neu-convex p-4 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-700">{comment.profiles?.full_name || "Unknown"}</span>
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 font-medium leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Actions */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">{t("add_to_card")}</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center px-4 py-3 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-xl text-sm font-bold text-gray-600 transition-all tracking-wide">
                      <Tag className="w-4 h-4 mr-3" /> {t("labels")}
                    </button>
                    <button 
                      onClick={handleAddChecklist}
                      className="w-full flex items-center px-4 py-3 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-xl text-sm font-bold text-gray-600 transition-all tracking-wide"
                    >
                      <CheckSquare className="w-4 h-4 mr-3" /> {t("checklist")}
                    </button>
                    <button className="w-full flex items-center px-4 py-3 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-xl text-sm font-bold text-gray-600 transition-all tracking-wide">
                      <Paperclip className="w-4 h-4 mr-3" /> {t("media_attachment")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
