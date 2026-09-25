import { addDays, toISO } from "./dates";

export type Lang = "en" | "fr" | "de";

export interface HolidayDef {
  id: string;
  name: Record<Lang, string>;
  /** Returns the ISO date of the holiday in the given year. */
  date: (year: number, easter: string) => string;
  /** Enabled by default for Meyriez (FR, reformed Lac/See district). */
  defaultOn: boolean;
}

/** Easter Sunday (Gregorian), anonymous algorithm. */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toISO(new Date(Date.UTC(year, month - 1, day)));
}

const fixed = (mmdd: string) => (year: number) => `${year}-${mmdd}`;
const fromEaster = (offset: number) => (_: number, easter: string) => addDays(easter, offset);

export const HOLIDAYS: HolidayDef[] = [
  { id: "newyear", name: { en: "New Year's Day", fr: "Nouvel An", de: "Neujahr" }, date: fixed("01-01"), defaultOn: true },
  { id: "berchtold", name: { en: "Berchtold's Day", fr: "Saint-Berchtold", de: "Berchtoldstag" }, date: fixed("01-02"), defaultOn: true },
  { id: "goodfriday", name: { en: "Good Friday", fr: "Vendredi saint", de: "Karfreitag" }, date: fromEaster(-2), defaultOn: true },
  { id: "eastermonday", name: { en: "Easter Monday", fr: "Lundi de Pâques", de: "Ostermontag" }, date: fromEaster(1), defaultOn: true },
  { id: "ascension", name: { en: "Ascension Day", fr: "Ascension", de: "Auffahrt" }, date: fromEaster(39), defaultOn: true },
  { id: "whitmonday", name: { en: "Whit Monday", fr: "Lundi de Pentecôte", de: "Pfingstmontag" }, date: fromEaster(50), defaultOn: true },
  { id: "corpuschristi", name: { en: "Corpus Christi", fr: "Fête-Dieu", de: "Fronleichnam" }, date: fromEaster(60), defaultOn: false },
  { id: "national", name: { en: "Swiss National Day", fr: "Fête nationale", de: "Bundesfeier" }, date: fixed("08-01"), defaultOn: true },
  { id: "assumption", name: { en: "Assumption", fr: "Assomption", de: "Mariä Himmelfahrt" }, date: fixed("08-15"), defaultOn: false },
  { id: "allsaints", name: { en: "All Saints' Day", fr: "Toussaint", de: "Allerheiligen" }, date: fixed("11-01"), defaultOn: false },
  { id: "immaculate", name: { en: "Immaculate Conception", fr: "Immaculée Conception", de: "Mariä Empfängnis" }, date: fixed("12-08"), defaultOn: false },
  { id: "christmas", name: { en: "Christmas Day", fr: "Noël", de: "Weihnachten" }, date: fixed("12-25"), defaultOn: true },
  { id: "stephen", name: { en: "St. Stephen's Day", fr: "Saint-Étienne", de: "Stephanstag" }, date: fixed("12-26"), defaultOn: true },
];

export const DEFAULT_HOLIDAY_IDS = HOLIDAYS.filter((h) => h.defaultOn).map((h) => h.id);

export interface CustomHoliday {
  date: string;
  name: string;
}

/** Map of ISO date -> holiday name for one year. */
export function holidaysForYear(
  year: number,
  enabledIds: string[],
  custom: CustomHoliday[] = [],
  lang: Lang = "en",
): Map<string, string> {
  const easter = easterSunday(year);
  const map = new Map<string, string>();
  for (const h of HOLIDAYS) {
    if (enabledIds.includes(h.id)) map.set(h.date(year, easter), h.name[lang]);
  }
  for (const c of custom) {
    if (c.date.startsWith(`${year}-`)) map.set(c.date, c.name);
  }
  return map;
}
