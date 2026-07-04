"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { logout } from "@/app/auth/actions";
import LanguageToggle from "@/components/layout/LanguageToggle";
import { Search, Bell, LogOut, User, Menu } from "lucide-react";

export default function TopBar({ userEmail }: { userEmail: string | undefined }) {
  const { t } = useLanguage();

  return (
    <header 
      className="h-20 flex items-center justify-between px-4 md:px-8 mb-6 rounded-3xl mx-4 mt-4 relative z-10"
      style={{
        background: 'linear-gradient(135deg, #0D2657 0%, #0D4A8A 100%)',
        boxShadow: '6px 6px 20px rgba(8,23,64,0.5), -2px -2px 10px rgba(44,116,177,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-2 flex-1 md:flex-none">
        <label htmlFor="mobile-menu" className="md:hidden p-2.5 mr-1 rounded-full text-blue-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex-shrink-0">
          <Menu size={20} />
        </label>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-blue-400/60" />
          </div>
          <input 
            type="text" 
            placeholder={t("search_placeholder" as any) || "Tìm kiếm..."} 
            className="w-full rounded-full py-2.5 pl-12 pr-4 text-sm text-blue-100 placeholder-blue-400/50 focus:ring-2 focus:ring-sky-400 outline-none transition-all border border-blue-500/20"
            style={{
              background: 'rgba(13, 38, 87, 0.6)',
              boxShadow: 'inset 3px 3px 6px rgba(8,23,64,0.5), inset -2px -2px 5px rgba(44,116,177,0.2)',
            }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <button className="p-3 rounded-full text-blue-300 hover:text-white hover:bg-white/10 transition-all">
          <Bell size={20} />
        </button>

        <div className="h-8 w-px bg-blue-500/30"></div>

        <LanguageToggle />

        <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sky-300 shrink-0"
            style={{ background: 'rgba(44,116,177,0.3)', border: '1px solid rgba(44,116,177,0.4)' }}
          >
            <User size={18} />
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs text-blue-400/70 font-medium uppercase tracking-wider">{t("nav_profile") || "PROFILE"}</span>
            <span className="text-sm font-semibold text-blue-100">{userEmail || "Guest"}</span>
          </div>
        </div>

        <form action={logout} className="ml-2">
          <button 
            type="submit" 
            title={t("sign_out") as string}
            className="p-3 rounded-full text-blue-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
          >
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
