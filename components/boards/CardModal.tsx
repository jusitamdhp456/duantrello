"use client";

import { X, CheckSquare, MessageSquare, Tag, Paperclip, Loader2, Users, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { createClient } from "@/lib/supabase/client";
import { 
  updateCardDetails, createChecklist, createChecklistItem, toggleChecklistItem, addComment,
  getBoardLabels, getWorkspaceMembers, createLabel, assignLabelToCard, removeLabelFromCard,
  assignMemberToCard, removeMemberFromCard
} from "@/app/actions/boards";

interface CardModalProps {
  card: any;
  boardId?: string;
  onClose: () => void;
}

export default function CardModal({ card, boardId, onClose }: CardModalProps) {
  const { t } = useLanguage();
  const { activeWorkspaceId } = useWorkspace();
  const supabase = createClient();
  
  const [description, setDescription] = useState(card.description || "");
  const [isSavingDesc, setIsSavingDesc] = useState(false);
  
  const [checklists, setChecklists] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  // New states for Labels, Members, Due Date
  const [boardLabels, setBoardLabels] = useState<any[]>([]);
  const [cardLabels, setCardLabels] = useState<any[]>(card.cards_labels_map?.map((cl: any) => cl.card_labels) || []);
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
  const [cardMembers, setCardMembers] = useState<any[]>(card.card_members?.map((cm: any) => ({ user_id: cm.user_id, ...cm.profiles })) || []);
  const [dueDate, setDueDate] = useState<string | null>(card.due_date || null);

  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const LABEL_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"];

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

    // Fetch Labels & Members
    if (boardId) {
      const bLabels = await getBoardLabels(boardId);
      setBoardLabels(bLabels);
    }

    if (activeWorkspaceId) {
      const wMembers = await getWorkspaceMembers(activeWorkspaceId);
      setWorkspaceMembers(wMembers);
    }
    
    // If we didn't get them from initial load (e.g. nested properly), fetch them
    if (cardLabels.length === 0) {
      const { data: cLabels } = await supabase.from('cards_labels_map').select('label_id, card_labels(*)').eq('card_id', card.id);
      if (cLabels) setCardLabels(cLabels.map(cl => cl.card_labels));
    }
    
    if (cardMembers.length === 0) {
      const { data: cMembers } = await supabase.from('card_members').select('user_id, profiles(full_name, avatar_url)').eq('card_id', card.id);
      if (cMembers) setCardMembers(cMembers.map(cm => ({ user_id: cm.user_id, ...cm.profiles })));
    }
    
    setIsLoading(false);
  }

  const handleSaveDescription = async () => {
    setIsSavingDesc(true);
    try {
      await updateCardDetails(card.id, { description });
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

  const handleToggleLabel = async (label: any) => {
    const isAssigned = cardLabels.some(l => l.id === label.id);
    try {
      if (isAssigned) {
        await removeLabelFromCard(card.id, label.id);
        setCardLabels(cardLabels.filter(l => l.id !== label.id));
      } else {
        await assignLabelToCard(card.id, label.id);
        setCardLabels([...cardLabels, label]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!boardId) return;
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const color = (form.elements.namedItem('color') as HTMLInputElement).value;
    if (!name || !color) return;
    try {
      const newLabel = await createLabel(boardId, name, color);
      setBoardLabels([...boardLabels, newLabel]);
      await handleToggleLabel(newLabel);
      form.reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMember = async (member: any) => {
    const isAssigned = cardMembers.some(m => m.user_id === member.user_id);
    try {
      if (isAssigned) {
        await removeMemberFromCard(card.id, member.user_id);
        setCardMembers(cardMembers.filter(m => m.user_id !== member.user_id));
      } else {
        await assignMemberToCard(card.id, member.user_id);
        setCardMembers([...cardMembers, member]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setDueDate(date || null);
    try {
      await updateCardDetails(card.id, { due_date: date ? new Date(date).toISOString() : null });
    } catch (err) {
      console.error(err);
    }
  };

  if (!card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-neu-base/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-neu-base rounded-[2.5rem] shadow-neu-convex w-full max-w-4xl max-h-[90vh] flex flex-col z-10 overflow-hidden border-none">
        
        <div className="flex items-center justify-between p-8 bg-neu-base border-b border-gray-200/20">
          <div>
            <h2 className="text-2xl font-bold text-gray-700 tracking-wide">{card.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:shadow-neu-concave transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              
              {/* Main Content */}
              <div className="md:col-span-3 space-y-8">
                
                {/* Meta Information Bar (Labels, Members, Due Date) */}
                <div className="flex flex-wrap gap-8 mb-6">
                  {cardMembers.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Members</h3>
                      <div className="flex -space-x-2">
                        {cardMembers.map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 border-2 border-white shadow-sm" title={m.full_name || m.profiles?.full_name}>
                            {m.avatar_url || m.profiles?.avatar_url ? (
                              <img src={m.avatar_url || m.profiles?.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (m.full_name || m.profiles?.full_name || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cardLabels.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Labels</h3>
                      <div className="flex flex-wrap gap-2">
                        {cardLabels.map(l => (
                          <span key={l.id} className="px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm" style={{ backgroundColor: l.color || '#3b82f6' }}>
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dueDate && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Due Date</h3>
                      <div className={`flex items-center space-x-2 text-sm font-bold px-3 py-1.5 rounded-lg ${new Date(dueDate) < new Date() ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                        <Clock className="w-4 h-4" />
                        <span>{new Date(dueDate).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

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
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave active:shadow-neu-pressed transition-all disabled:opacity-50 flex items-center"
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
              <div className="md:col-span-1 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">{t("add_to_card")}</h3>
                  <div className="space-y-3 relative">
                    
                    {/* Members Button */}
                    <button 
                      onClick={() => { setShowMemberPicker(!showMemberPicker); setShowLabelPicker(false); setShowDatePicker(false); }}
                      className="w-full flex items-center px-4 py-3 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-xl text-sm font-bold text-gray-600 transition-all tracking-wide"
                    >
                      <Users className="w-4 h-4 mr-3" /> Members
                    </button>
                    {showMemberPicker && (
                      <div className="absolute top-12 left-0 w-full bg-white shadow-xl rounded-xl p-4 z-20 border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Workspace Members</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {workspaceMembers.map(m => {
                            const isAssigned = cardMembers.some(cm => cm.user_id === m.user_id);
                            return (
                              <div key={m.user_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => handleToggleMember(m)}>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                    {(m.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 truncate w-32">{m.profiles?.full_name || m.profiles?.email}</span>
                                </div>
                                {isAssigned && <CheckSquare className="w-4 h-4 text-indigo-600" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Labels Button */}
                    <button 
                      onClick={() => { setShowLabelPicker(!showLabelPicker); setShowMemberPicker(false); setShowDatePicker(false); }}
                      className="w-full flex items-center px-4 py-3 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-xl text-sm font-bold text-gray-600 transition-all tracking-wide"
                    >
                      <Tag className="w-4 h-4 mr-3" /> Labels
                    </button>
                    {showLabelPicker && (
                      <div className="absolute top-24 left-0 w-full bg-white shadow-xl rounded-xl p-4 z-20 border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Board Labels</h4>
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                          {boardLabels.map(l => {
                            const isAssigned = cardLabels.some(cl => cl.id === l.id);
                            return (
                              <div key={l.id} className="flex items-center space-x-2 cursor-pointer hover:opacity-80" onClick={() => handleToggleLabel(l)}>
                                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: l.color || '#3b82f6' }}>
                                  {isAssigned && <CheckSquare className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate">{l.name}</span>
                              </div>
                            );
                          })}
                        </div>
                        <form onSubmit={handleCreateLabel} className="border-t pt-3">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Create New Label</h4>
                          <input name="name" type="text" placeholder="Label name" className="w-full text-xs p-2 mb-2 bg-gray-50 rounded border border-gray-200" required />
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {LABEL_COLORS.map(c => (
                              <label key={c} className="cursor-pointer">
                                <input type="radio" name="color" value={c} className="sr-only peer" required />
                                <div className="w-5 h-5 rounded peer-checked:ring-2 ring-offset-1 ring-gray-400" style={{ backgroundColor: c }}></div>
                              </label>
                            ))}
                          </div>
                          <button type="submit" className="w-full bg-purple-50 text-purple-600 text-xs font-bold py-1.5 rounded">Create</button>
                        </form>
                      </div>
                    )}

                    {/* Due Date Button */}
                    <button 
                      onClick={() => { setShowDatePicker(!showDatePicker); setShowLabelPicker(false); setShowMemberPicker(false); }}
                      className="w-full flex items-center px-4 py-3 bg-neu-base shadow-neu-convex hover:shadow-neu-concave rounded-xl text-sm font-bold text-gray-600 transition-all tracking-wide"
                    >
                      <Calendar className="w-4 h-4 mr-3" /> Due Date
                    </button>
                    {showDatePicker && (
                      <div className="absolute top-36 left-0 w-full bg-white shadow-xl rounded-xl p-4 z-20 border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Set Due Date</h4>
                        <input 
                          type="datetime-local" 
                          value={dueDate ? new Date(new Date(dueDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""}
                          onChange={handleDateChange}
                          className="w-full text-sm p-2 bg-gray-50 rounded border border-gray-200 mb-2"
                        />
                        {dueDate && (
                          <button onClick={() => handleDateChange({ target: { value: '' } } as any)} className="w-full bg-red-50 text-red-600 text-xs font-bold py-1.5 rounded">
                            Remove
                          </button>
                        )}
                      </div>
                    )}

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
