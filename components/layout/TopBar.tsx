"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { logout } from "@/app/auth/actions";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { Search, Bell, LogOut, User, Menu } from "lucide-react";

export default function TopBar({ userEmail }: { userEmail: string | undefined }) {
  const { t } = useLanguage();

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-neu-base mb-6 rounded-3xl shadow-neu-convex mx-4 mt-4 relative z-10">
      <div className="flex items-center gap-2 flex-1 md:flex-none">
        <label htmlFor="mobile-menu" className="md:hidden p-2.5 mr-1 rounded-full text-gray-500 hover:text-purple-600 shadow-neu-convex hover:shadow-neu-concave transition-all cursor-pointer flex-shrink-0">
          <Menu size={20} />
        </label>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder={t("search_placeholder" as any) || "Tìm kiếm..."} 
            className="w-full bg-neu-base shadow-neu-concave border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <button className="p-3 rounded-full text-gray-500 hover:text-purple-600 hover:shadow-neu-concave transition-all">
          <Bell size={20} />
        </button>

        <div className="h-8 w-px bg-gray-300 opacity-50"></div>

        <LanguageToggle />

        <div className="flex items-center gap-3 pl-2">
          <div className="w-10 h-10 rounded-full bg-neu-base shadow-neu-convex flex items-center justify-center text-purple-600">
            <User size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t("nav_profile") || "PROFILE"}</span>
            <span className="text-sm font-semibold text-gray-700">{userEmail || "Guest"}</span>
          </div>
        </div>

        <form action={logout} className="ml-2">
          <button 
            type="submit" 
            title={t("sign_out") as string}
            className="p-3 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-neu-concave transition-all flex items-center justify-center"
          >
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
