"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkspaceSwitcher from "@/components/layout/WorkspaceSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LayoutDashboard, CheckSquare, Target, DollarSign, Settings, Video, Award } from "lucide-react";

export default function Sidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "nav_dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "nav_todo", icon: CheckSquare },
    { href: "/leaderboard", label: "nav_leaderboard", icon: Award },
    { href: "/meetings", label: "nav_meetings", icon: Video },
    { href: "/my-salary", label: "nav_my_salary", icon: DollarSign },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between z-10 m-4 rounded-[2rem] overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0D2657 0%, #0D3E8A 60%, #1A5CB0 100%)',
        boxShadow: '6px 6px 20px rgba(8,23,64,0.5), -2px -2px 10px rgba(44,116,177,0.2)',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-28 flex flex-col items-center justify-center relative pt-4">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white/10 backdrop-blur p-0.5 border border-blue-400/30">
              <Image src="/logo.png" alt="CreativeOS Logo" width={32} height={32} className="rounded-lg object-contain" />
            </div>
            <div className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-200 tracking-tighter drop-shadow-sm">
              CreativeOS
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-blue-300/60 mt-2 font-semibold">Workspace</div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-5 pb-6">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-blue-300/80 hover:text-white hover:bg-white/10'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, rgba(44,145,206,0.5) 0%, rgba(27,80,160,0.6) 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 15px rgba(13,38,87,0.4)',
                } : {}}
              >
                <Icon size={20} className={isActive ? 'text-sky-300' : 'text-blue-400/70'} />
                {t(item.label as any) || item.label}
              </Link>
            );
          })}
        </nav>

        {/* Settings Footer */}
        <div className="p-4 pb-6 mt-auto">
          <Link 
            href="/settings" 
            className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl text-sm font-medium text-blue-300/80 hover:text-white hover:bg-white/10 transition-all duration-300 border border-blue-500/20"
          >
            <Settings size={18} />
            <span>{t("nav_settings") || "Cài đặt"}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
