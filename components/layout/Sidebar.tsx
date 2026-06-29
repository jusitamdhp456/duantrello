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
          <Link href="/boards" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_boards")}
          </Link>
          <Link href="/campaigns" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_campaigns")}
          </Link>
          <Link href="/creative-briefs" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_briefs")}
          </Link>
          <Link href="/video-ads" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_video_ads")}
          </Link>
          <Link href="/media-library" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
            {t("nav_media")}
          </Link>
          <div className="pt-2">
            <Link href="/analytics" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
              {t("nav_analytics")}
            </Link>
            <Link href="/leaderboard" className="block px-4 py-3 rounded-2xl text-sm font-medium text-gray-600 hover:shadow-neu-concave transition-all duration-200">
              {t("nav_leaderboard")}
            </Link>
          </div>
        </nav>
      </div>
      
      <div className="p-6">
        <div className="mb-4 text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{t("nav_profile")}</p>
          <p className="text-sm font-medium truncate mt-2 text-gray-600">{userEmail}</p>
        </div>
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
