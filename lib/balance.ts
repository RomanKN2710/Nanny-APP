// The "hours account" (Arbeitszeitkonto / compte d'heures).
//
// Every contractual workday that is not a public holiday is "due" for
// weeklyHours / workDays.length hours. Worked hours, vacation and sick days are
// "credited". Balance = credited − due. A positive balance is overtime that has
// to be compensated with time off within 3 months (at the latest 12 months),
// otherwise it is paid out without premium (contract §11). Days the family is
// away and does not need the nanny simply credit nothing, so the missing hours
// are made up later (contract §10).

import {
  addDays,
  addMonths,
  daysInYear,
  diffDays,
  eachDay,
  isoWeekday,
  maxISO,
  minISO,
  round2,
  shiftHours,
  yearOf,
} from "./dates";
import { holidaysForYear } from "./holidays";
import type { Entry, Settings } from "./types";

export type Contract = Pick<
  Settings,
  "startDate" | "weeklyHours" | "workDays" | "vacationWeeks" | "enabledHolidays" | "customHolidays"
>;

export function dailyTarget(c: Contract): number {
  return c.workDays.length ? c.weeklyHours / c.workDays.length : 0;
}

function holidayLookup(c: Contract) {
  const cache = new Map<number, Map<string, string>>();
  return (iso: string): string | undefined => {
    const y = yearOf(iso);
    let map = cache.get(y);
    if (!map) {
      map = holidaysForYear(y, c.enabledHolidays, c.customHolidays);
      cache.set(y, map);
    }
    return map.get(iso);
  };
}

/** Hours due on one day (0 before the start date, on days off and on holidays). */
export function dueOn(iso: string, c: Contract, isHoliday = holidayLookup(c)): number {
  if (iso < c.startDate) return 0;
  if (!c.workDays.includes(isoWeekday(iso))) return 0;
  if (isHoliday(iso)) return 0;
  return dailyTarget(c);
}

export function dueBetween(from: string, to: string, c: Contract): number {
  const isHoliday = holidayLookup(c);
  let total = 0;
  for (const d of eachDay(maxISO(from, c.startDate), to)) total += dueOn(d, c, isHoliday);
  return total;
}

/** Hours an entry credits to the account. A running shift (no end yet) credits nothing. */
export function entryHours(e: Pick<Entry, "type" | "start" | "end" | "breakMinutes" | "hours">, c: Contract): number {
  switch (e.type) {
    case "work":
      if (e.start && e.end) return shiftHours(e.start, e.end, e.breakMinutes);
      return e.hours ?? 0;
    case "vacation":
    case "sick":
      return e.hours ?? dailyTarget(c);
    case "adjustment":
      return e.hours ?? 0;
  }
}

export function isRunning(e: Entry): boolean {
  return e.type === "work" && !!e.start && !e.end && e.hours == null;
}

export interface OvertimeLot {
  date: string;
  hours: number;
}

export interface Account {
  balance: number;
  due: number;
  credited: number;
  /** Positive balance split into lots by the day it was earned (oldest first). */
  lots: OvertimeLot[];
  /** Hours of overtime older than 3 months → should be compensated now. */
  overdue3m: number;
  /** Hours of overtime older than 12 months → must be paid out. */
  overdue12m: number;
  pendingCount: number;
}

/**
 * Balance from the start date up to and including `today`. Today's due hours only
 * count once something was logged for today, so the balance doesn't dip every morning.
 */
export function computeAccount(entries: Entry[], c: Contract, today: string): Account {
  const isHoliday = holidayLookup(c);
  const perDay = new Map<string, number>();
  let pendingCount = 0;
  for (const e of entries) {
    if (e.status === "pending") pendingCount++;
    if (e.date > today || e.date < c.startDate) continue;
    perDay.set(e.date, (perDay.get(e.date) ?? 0) + entryHours(e, c));
  }

  const lots: OvertimeLot[] = [];
  let debt = 0;
  let due = 0;
  let credited = 0;
  const lastDay = perDay.has(today) ? today : addDays(today, -1);

  for (const d of eachDay(c.startDate, lastDay)) {
    const dDue = dueOn(d, c, isHoliday);
    const dCredit = perDay.get(d) ?? 0;
    due += dDue;
    credited += dCredit;
    let delta = dCredit - dDue;
    if (Math.abs(delta) < 1e-9) continue;
    if (delta > 0) {
      const repay = Math.min(debt, delta);
      debt -= repay;
      delta -= repay;
      if (delta > 1e-9) lots.push({ date: d, hours: delta });
    } else {
      let missing = -delta;
      while (missing > 1e-9 && lots.length) {
        const take = Math.min(lots[0].hours, missing);
        lots[0].hours -= take;
        missing -= take;
        if (lots[0].hours <= 1e-9) lots.shift();
      }
      debt += missing;
    }
  }

  const limit3m = addMonths(today, -3);
  const limit12m = addMonths(today, -12);
  const lotsTotal = lots.reduce((s, l) => s + l.hours, 0);
  return {
    balance: round2(lotsTotal - debt),
    due: round2(due),
    credited: round2(credited),
    lots: lots.map((l) => ({ date: l.date, hours: round2(l.hours) })),
    overdue3m: round2(lots.filter((l) => l.date < limit3m).reduce((s, l) => s + l.hours, 0)),
    overdue12m: round2(lots.filter((l) => l.date < limit12m).reduce((s, l) => s + l.hours, 0)),
    pendingCount,
  };
}

export interface YearSummary {
  year: number;
  /** Workdays in the (employed part of the) year, excluding public holidays. */
  workdays: number;
  holidaysOnWorkdays: number;
  grossHours: number;
  vacationDaysEntitled: number;
  /** The hours she actually has to work this year: gross hours minus vacation. */
  budgetHours: number;
  workedHours: number;
  sickHours: number;
  adjustmentHours: number;
  vacationDaysTaken: number;
  vacationDaysPlanned: number;
  vacationDaysLeft: number;
  /** Where the worked hours should be today at an even pace. */
  expectedToDate: number;
  remainingHours: number;
}

/** Vacation entitlement for a calendar year, pro rata in the first year, rounded to half days. */
export function vacationEntitlement(year: number, c: Contract): number {
  const full = c.vacationWeeks * c.workDays.length;
  const from = maxISO(`${year}-01-01`, c.startDate);
  const to = `${year}-12-31`;
  if (from > to) return 0;
  const share = (diffDays(from, to) + 1) / daysInYear(year);
  return Math.round(full * share * 2) / 2;
}

export function yearSummary(entries: Entry[], c: Contract, year: number, today: string): YearSummary {
  const isHoliday = holidayLookup(c);
  const from = maxISO(`${year}-01-01`, c.startDate);
  const to = `${year}-12-31`;
  const target = dailyTarget(c);

  let workdays = 0;
  let holidaysOnWorkdays = 0;
  if (from <= to) {
    for (const d of eachDay(from, to)) {
      if (!c.workDays.includes(isoWeekday(d))) continue;
      if (isHoliday(d)) holidaysOnWorkdays++;
      else workdays++;
    }
  }
  const grossHours = workdays * target;
  const vacationDaysEntitled = vacationEntitlement(year, c);
  const budgetHours = grossHours - vacationDaysEntitled * target;

  let workedHours = 0;
  let sickHours = 0;
  let adjustmentHours = 0;
  let vacationTakenHours = 0;
  let vacationPlannedHours = 0;
  for (const e of entries) {
    if (yearOf(e.date) !== year || e.date < c.startDate) continue;
    const h = entryHours(e, c);
    if (e.type === "vacation") {
      if (e.date <= today) vacationTakenHours += h;
      else vacationPlannedHours += h;
      continue;
    }
    if (e.date > today) continue;
    if (e.type === "work") workedHours += h;
    else if (e.type === "sick") sickHours += h;
    else adjustmentHours += h;
  }

  const dueToDate = from <= to && from <= today ? dueBetween(from, minISO(today, to), c) : 0;
  const vacationDaysTaken = target ? vacationTakenHours / target : 0;
  const vacationDaysPlanned = target ? vacationPlannedHours / target : 0;
  const done = workedHours + sickHours + adjustmentHours;

  return {
    year,
    workdays,
    holidaysOnWorkdays,
    grossHours: round2(grossHours),
    vacationDaysEntitled,
    budgetHours: round2(budgetHours),
    workedHours: round2(workedHours),
    sickHours: round2(sickHours),
    adjustmentHours: round2(adjustmentHours),
    vacationDaysTaken: round2(vacationDaysTaken),
    vacationDaysPlanned: round2(vacationDaysPlanned),
    vacationDaysLeft: round2(vacationDaysEntitled - vacationDaysTaken - vacationDaysPlanned),
    expectedToDate: round2(Math.max(0, dueToDate - vacationTakenHours)),
    remainingHours: round2(budgetHours - done),
  };
}

export interface DayRow {
  date: string;
  due: number;
  credited: number;
  holiday?: string;
}

export function daysOverview(entries: Entry[], c: Contract, from: string, to: string): DayRow[] {
  const isHoliday = holidayLookup(c);
  const rows: DayRow[] = [];
  for (const d of eachDay(from, to)) {
    const credited = entries.filter((e) => e.date === d).reduce((s, e) => s + entryHours(e, c), 0);
    rows.push({ date: d, due: round2(dueOn(d, c, isHoliday)), credited: round2(credited), holiday: isHoliday(d) });
  }
  return rows;
}

export function hourlyRate(s: Pick<Settings, "monthlySalary" | "weeklyHours">): number {
  if (!s.weeklyHours) return 0;
  return round2((s.monthlySalary * 12) / (s.weeklyHours * 52));
}
