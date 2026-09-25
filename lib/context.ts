import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { requireRole } from "./auth";
import { isLang, translator, type Lang } from "./i18n";
import { getSettings } from "./repo";

export const LANG_COOKIE = "lang";

export const getLang = cache(async (): Promise<Lang> => {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(v)) return v;
  try {
    return (await getSettings()).defaultLang;
  } catch {
    return "fr";
  }
});

/** Role, language, translator and settings for the current request (redirects to /login if needed). */
export const getContext = cache(async () => {
  const role = await requireRole();
  const [lang, settings] = await Promise.all([getLang(), getSettings()]);
  return { role, lang, t: translator(lang), settings };
});
