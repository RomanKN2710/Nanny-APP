"use client";

import { useTransition } from "react";
import { setLanguage } from "@/app/actions";
import { LANGS } from "@/lib/i18n";
import { useLang } from "./i18n";

export function LangSwitch() {
  const lang = useLang();
  const [pending, start] = useTransition();
  return (
    <div className="flex rounded-full bg-white/80 p-1 text-xs font-bold shadow-[var(--shadow-soft)]" aria-busy={pending}>
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => start(() => setLanguage(l))}
          className={`rounded-full px-2.5 py-1 uppercase transition ${l === lang ? "bg-coral text-white" : "text-ink-soft hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
