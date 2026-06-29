"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { createClient } from "@/lib/supabase/client";
import { updateWorkspaceName, deleteWorkspace, addMemberByEmail, removeMember, updateMemberRole } from "@/app/actions/workspaces";
import { Loader2, Settings, Users, Trash2, UserPlus, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { activeWorkspaceId, workspaces, setActiveWorkspaceId, isLoading: isWorkspaceLoading } = useWorkspace();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"general" | "members">("general");
  
  // General State
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Members State
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentUserRole, setCurrentUserRole] = useState("member");
  const [currentUserId, setCurrentUserId] = useState("");

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    async function fetchMembers() {
      if (!activeWorkspaceId) return;
      setIsLoadingMembers(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Fetch members and join with profiles to get full name and email
      const { data: memberData, error } = await supabase
        .from('workspace_members')
        .select(`
          role,
          user_id,
          profiles:user_id ( full_name, email )
        `)
        .eq('workspace_id', activeWorkspaceId);

      if (memberData) {
        setMembers(memberData);
        const myRole = memberData.find(m => m.user_id === user?.id)?.role || 'member';
        setCurrentUserRole(myRole);
      }
      setIsLoadingMembers(false);
    }

    if (activeTab === "members") {
      fetchMembers();
    }
  }, [activeWorkspaceId, activeTab, supabase]);

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;
    setIsSavingName(true);
    try {
      await updateWorkspaceName(activeWorkspaceId, workspaceName);
      showMessage(t("success"), "success");
      // WorkspaceProvider might need a hard refresh or we can let it re-fetch on reload
      router.refresh();
    } catch (err: any) {
      showMessage(err.message || t("error"), "error");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspaceId) return;
    if (!confirm(t("delete_confirm"))) return;
    setIsDeleting(true);
    try {
      await deleteWorkspace(activeWorkspaceId);
      setActiveWorkspaceId(""); // Clear active workspace
      router.push("/dashboard");
    } catch (err: any) {
      showMessage(err.message || t("error"), "error");
      setIsDeleting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await addMemberByEmail(activeWorkspaceId, inviteEmail);
      setInviteEmail("");
      showMessage(t("add_member_success"), "success");
      // refresh members
      setActiveTab("general"); setTimeout(() => setActiveTab("members"), 50);
    } catch (err: any) {
      showMessage(err.message || t("add_member_error"), "error");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeWorkspaceId) return;
    if (!confirm(t("delete_confirm"))) return;
    try {
      await removeMember(activeWorkspaceId, userId);
      setMembers(members.filter(m => m.user_id !== userId));
      showMessage(t("remove_member_success"), "success");
    } catch (err: any) {
      showMessage(err.message || t("error"), "error");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!activeWorkspaceId) return;
    try {
      await updateMemberRole(activeWorkspaceId, userId, newRole);
      setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m));
      showMessage(t("update_role_success"), "success");
    } catch (err: any) {
      showMessage(err.message || t("error"), "error");
    }
  };

  if (isWorkspaceLoading) {
    return <div className="p-8 flex items-center"><Loader2 className="animate-spin mr-2" /> {t("loading")}</div>;
  }

  if (!activeWorkspaceId) {
    return <div className="p-8 text-gray-500">{t("select_workspace")}</div>;
  }

  const isAdminOrOwner = currentUserRole === 'admin' || currentUserRole === 'owner';
  const isOwner = currentUserRole === 'owner';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-light text-gray-700 tracking-wide mb-10">{t("workspace_settings")}</h1>

      <div className="flex space-x-6 mb-8">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center px-6 py-3 rounded-full font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "general" 
              ? "bg-neu-base shadow-neu-pressed text-blue-600" 
              : "bg-neu-base shadow-neu-convex text-gray-500 hover:shadow-neu-concave"
          }`}
        >
          <Settings className="w-4 h-4 mr-2" /> {t("general")}
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center px-6 py-3 rounded-full font-bold uppercase tracking-wider transition-all duration-300 ${
            activeTab === "members" 
              ? "bg-neu-base shadow-neu-pressed text-blue-600" 
              : "bg-neu-base shadow-neu-convex text-gray-500 hover:shadow-neu-concave"
          }`}
        >
          <Users className="w-4 h-4 mr-2" /> {t("members")}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 mb-8 rounded-xl text-sm font-semibold tracking-wide ${
          message.type === 'success' ? 'text-green-600 bg-green-50 shadow-neu-convex' : 'text-red-600 bg-red-50 shadow-neu-convex'
        }`}>
          {message.text}
        </div>
      )}

      {activeTab === "general" && (
        <div className="space-y-10">
          <div className="bg-neu-base rounded-[2rem] shadow-neu-convex p-8">
            <h2 className="text-xl font-semibold text-gray-700 tracking-wide mb-6">{t("general")}</h2>
            <form onSubmit={handleUpdateName} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  {t("workspace_name")}
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={!isAdminOrOwner}
                  className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium placeholder-gray-400 disabled:opacity-50"
                  required
                />
              </div>
              {isAdminOrOwner && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingName}
                    className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm px-8 py-3 rounded-full font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave active:shadow-neu-pressed transition-all disabled:opacity-50"
                  >
                    {isSavingName && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t("save_changes")}
                  </button>
                </div>
              )}
            </form>
          </div>

          {isOwner && (
            <div className="bg-neu-base rounded-[2rem] shadow-neu-convex p-8 border border-red-100">
              <h2 className="text-xl font-semibold text-red-600 tracking-wide mb-4 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2" /> {t("delete_workspace")}
              </h2>
              <p className="text-gray-500 text-sm font-medium mb-6">
                {t("delete_workspace_desc")}
              </p>
              <button
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="flex items-center bg-red-500 text-white text-sm px-6 py-3 rounded-full font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {t("delete_workspace")}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-10">
          {isAdminOrOwner && (
            <div className="bg-neu-base rounded-[2rem] shadow-neu-convex p-8">
              <h2 className="text-xl font-semibold text-gray-700 tracking-wide mb-4 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-indigo-500" /> {t("invite_member")}
              </h2>
              <p className="text-gray-500 text-sm font-medium mb-6">
                {t("invite_member_desc")}
              </p>
              <form onSubmit={handleInvite} className="flex gap-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("invite_email_placeholder")}
                  className="flex-1 text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium placeholder-gray-400"
                  required
                />
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex items-center bg-gradient-to-r from-green-400 to-emerald-600 text-white text-sm px-8 py-3 rounded-xl font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave active:shadow-neu-pressed transition-all disabled:opacity-50"
                >
                  {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {t("invite_btn")}
                </button>
              </form>
            </div>
          )}

          <div className="bg-neu-base rounded-[2rem] shadow-neu-convex overflow-hidden p-8">
            <h2 className="text-xl font-semibold text-gray-700 tracking-wide mb-6">{t("members")}</h2>
            
            {isLoadingMembers ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-500 w-6 h-6" /></div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-neu-base shadow-neu-concave rounded-2xl">
                    <div>
                      <p className="font-bold text-gray-700 text-lg tracking-wide flex items-center">
                        {member.profiles?.full_name || "Unknown"}
                        {member.user_id === currentUserId && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase tracking-widest shadow-neu-convex">You</span>}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 font-medium">{member.profiles?.email}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                      {isOwner && member.user_id !== currentUserId ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                          className="bg-neu-base shadow-neu-convex border-none text-sm font-bold uppercase tracking-wider text-gray-600 rounded-lg p-2 focus:outline-none focus:ring-0"
                        >
                          <option value="member">{t("member")}</option>
                          <option value="admin">{t("admin")}</option>
                          <option value="owner">{t("owner")}</option>
                        </select>
                      ) : (
                        <span className="flex items-center text-sm font-bold uppercase tracking-wider text-indigo-500 bg-neu-base shadow-neu-convex px-4 py-2 rounded-lg">
                          {member.role === 'owner' && <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" />}
                          {t(member.role as any) || member.role}
                        </span>
                      )}

                      {(isAdminOrOwner && member.user_id !== currentUserId && member.role !== 'owner') && (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-2 text-red-400 hover:text-red-600 bg-neu-base shadow-neu-convex rounded-lg hover:shadow-neu-concave transition-all"
                          title={t("remove")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
