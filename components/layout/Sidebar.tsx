"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkspaceSwitcher from "@/components/layout/WorkspaceSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LayoutDashboard, CheckSquare, Target, DollarSign, Settings } from "lucide-react";

export default function Sidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "nav_dashboard", icon: LayoutDashboard },
    { href: "/tasks", label: "nav_todo", icon: CheckSquare },
    { href: "/my-kpi", label: "nav_my_kpi", icon: Target },
    { href: "/my-salary", label: "nav_my_salary", icon: DollarSign },
  ];

  return (
    <aside className="w-64 bg-neu-base shadow-neu-convex flex flex-col justify-between z-10 m-4 rounded-[2rem] overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Logo Area */}
        <div className="h-28 flex flex-col items-center justify-center relative pt-4">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-neu-convex flex items-center justify-center bg-white p-0.5 border border-purple-100">
              <Image src="/logo.png" alt="CreativeOS Logo" width={32} height={32} className="rounded-lg object-contain" />
            </div>
            <div className="font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500 tracking-tighter drop-shadow-sm">
              CreativeOS
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-2 font-semibold">Workspace</div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-5 pb-6">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation */}
        <nav className="px-4 space-y-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'shadow-neu-concave text-purple-600 bg-neu-base' 
                    : 'text-gray-500 hover:shadow-neu-concave hover:text-purple-500'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-purple-500' : 'text-gray-400'} />
                {t(item.label as any) || item.label}
              </Link>
            );
          })}
        </nav>

        {/* Settings Footer */}
        <div className="p-4 pb-6 mt-auto">
          <Link 
            href="/settings" 
            className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl text-sm font-medium text-gray-500 shadow-neu-convex hover:shadow-neu-concave hover:text-purple-600 transition-all duration-300"
          >
            <Settings size={18} />
            <span>{t("nav_settings") || "Cài đặt"}</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
