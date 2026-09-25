"use client";

import { createContext, useContext, useMemo } from "react";
import { translator, type Lang, type T } from "@/lib/i18n";

const LangContext = createContext<Lang>("fr");

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT(): T {
  const lang = useLang();
  return useMemo(() => translator(lang), [lang]);
}
