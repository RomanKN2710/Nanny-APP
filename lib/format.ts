import { parseISO } from "./dates";
import { LOCALE, type Lang } from "./i18n";

export function fmtHours(n: number, lang: Lang, signed = false): string {
  const s = Math.abs(n).toLocaleString(LOCALE[lang], { maximumFractionDigits: 2 });
  if (!signed) return n < 0 ? `−${s}` : s;
  if (Math.abs(n) < 0.005) return "±0";
  return (n > 0 ? "+" : "−") + s;
}

export function fmtMoney(n: number, currency: string, lang: Lang, digits = 0): string {
  return new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function fmtDate(iso: string, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }): string {
  return new Intl.DateTimeFormat(LOCALE[lang], { timeZone: "UTC", ...opts }).format(parseISO(iso));
}

export function fmtMonth(iso: string, lang: Lang): string {
  const s = fmtDate(iso, lang, { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Weekday names, index 1 = Monday … 7 = Sunday. */
export function weekdayNames(lang: Lang, style: "short" | "long" | "narrow" = "short"): string[] {
  const names = [""];
  // 2024-01-01 was a Monday
  for (let i = 1; i <= 7; i++) names.push(fmtDate(`2024-01-0${i}`, lang, { weekday: style }));
  return names;
}
