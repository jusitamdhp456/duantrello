"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/actions/profile";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          setFullName(profile.full_name || "");
        }
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });
    try {
      await updateProfile(fullName);
      setMessage({ text: t("profile_updated"), type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || t("error"), type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 flex items-center"><Loader2 className="animate-spin mr-2" /> {t("loading")}</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-light text-gray-700 tracking-wide mb-10">{t("profile_title")}</h1>

      <div className="bg-neu-base rounded-[2rem] shadow-neu-convex p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
              {t("email_label")}
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-400 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">
              {t("full_name_label")}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-sm p-4 bg-neu-base shadow-neu-concave rounded-xl focus:outline-none border-none text-gray-700 font-medium placeholder-gray-400"
              required
            />
          </div>

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-semibold tracking-wide ${
              message.type === 'success' ? 'text-green-600 bg-green-50 shadow-neu-convex' : 'text-red-600 bg-red-50 shadow-neu-convex'
            }`}>
              {message.text}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm px-8 py-3 rounded-full font-bold uppercase tracking-wider shadow-neu-convex hover:shadow-neu-concave active:shadow-neu-pressed transition-all disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("update_profile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
