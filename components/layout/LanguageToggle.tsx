"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-neu-base shadow-neu-concave rounded-full p-1 w-max">
      <button
        onClick={() => setLanguage("en")}
        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
          language === "en"
            ? "shadow-neu-convex text-purple-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("vi")}
        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
          language === "vi"
            ? "shadow-neu-convex text-purple-500"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        VN
      </button>
    </div>
  );
}
