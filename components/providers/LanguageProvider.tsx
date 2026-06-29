"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, LanguageCode, TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("app_language") as LanguageCode;
    if (stored && (stored === "en" || stored === "vi")) {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  // Prevent hydration mismatch by not rendering anything until mounted
  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
