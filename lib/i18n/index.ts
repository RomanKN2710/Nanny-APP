import type { Lang } from "../holidays";
import { de } from "./de";
import { en, type Dict, type Key } from "./en";
import { fr } from "./fr";

export type { Key, Lang };
export const LANGS: Lang[] = ["fr", "de", "en"];
export const LANG_LABEL: Record<Lang, string> = { fr: "Français", de: "Deutsch", en: "English" };
export const LOCALE: Record<Lang, string> = { en: "en-GB", fr: "fr-CH", de: "de-CH" };

const dicts: Record<Lang, Dict> = { en, fr, de };

export type T = (key: Key, vars?: Record<string, string | number>) => string;

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "fr" || v === "de";
}

export function translator(lang: Lang): T {
  const dict = dicts[lang] ?? en;
  return (key, vars) => {
    let s: string = dict[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
