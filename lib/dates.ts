// All dates are handled as ISO strings ("YYYY-MM-DD") and times as "HH:MM".
// Arithmetic happens in UTC so daylight-saving changes never shift a day.

export const TIME_ZONE = "Europe/Zurich";

export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function nowHHMM(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toISO(parseISO(value)) === value;
}

export function isHHMM(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

export function addMonths(iso: string, n: number): string {
  const d = parseISO(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toISO(d);
}

/** Number of days from a to b (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(iso: string): number {
  const d = parseISO(iso).getUTCDay();
  return d === 0 ? 7 : d;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, 1 - isoWeekday(iso));
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 7) + "-01";
}

export function endOfMonth(iso: string): string {
  return addDays(addMonths(startOfMonth(iso), 1), -1);
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

export function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

export function* eachDay(from: string, to: string): Generator<string> {
  for (let d = from; d <= to; d = addDays(d, 1)) yield d;
}

export function maxISO(a: string, b: string): string {
  return a > b ? a : b;
}

export function minISO(a: string, b: string): string {
  return a < b ? a : b;
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Duration of a shift in hours. An end before the start is read as past midnight. */
export function shiftHours(start: string, end: string, breakMinutes = 0): number {
  let minutes = minutesOf(end) - minutesOf(start);
  if (minutes < 0) minutes += 24 * 60;
  return Math.max(0, minutes - breakMinutes) / 60;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
