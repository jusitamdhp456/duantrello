"use client";

import Link from "next/link";
import WorkspaceSwitcher from "@/components/layout/WorkspaceSwitcher";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { logout } from "@/app/auth/actions";

export default function Sidebar({ userEmail }: { userEmail: string | undefined }) {
  const { t } = useLanguage();

  return (
    <aside className="w-64 bg-neu-base shadow-neu-convex flex flex-col justify-between z-10 m-4 rounded-[2rem]">
      <div>
        <div className="h-20 flex items-center justify-center font-bold text-2xl text-gray-700 tracking-wider">
          Creative OS
        </div>
        <div className="px-4 pb-4">
          <WorkspaceSwitcher />
        </div>
        <nav className="px-4 space-y-3">
          <Link href="/dashboard" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_dashboard")}
          </Link>
          <Link href="/my-kpi" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_my_kpi")}
          </Link>
          <Link href="/my-salary" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_my_salary")}
          </Link>
        </nav>
      </div>
      
      <div className="p-6">
        <Link href="/profile" className="block mb-4 text-center hover:bg-neu-base hover:shadow-neu-concave p-3 rounded-2xl transition-all group">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest group-hover:text-blue-500 transition-colors">{t("nav_profile")}</p>
          <p className="text-sm font-medium truncate mt-2 text-gray-600 group-hover:text-gray-800">{userEmail}</p>
        </Link>
        <Link href="/settings" className="block w-full text-center px-4 py-3 mb-3 rounded-full text-sm font-medium text-gray-600 shadow-neu-convex hover:shadow-neu-concave hover:text-blue-600 transition-all duration-200">
          {t("nav_settings")}
        </Link>
        <form action={logout}>
          <button 
            type="submit" 
            className="w-full text-center px-4 py-3 rounded-full text-sm font-medium text-red-500 shadow-neu-convex hover:shadow-neu-concave hover:text-red-600 transition-all duration-200"
          >
            {t("sign_out")}
          </button>
        </form>
      </div>
    </aside>
  );
}
