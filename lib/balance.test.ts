import { describe, expect, it } from "vitest";
import { computeAccount, dailyTarget, dueBetween, entryHours, hourlyRate, vacationEntitlement, yearSummary, type Contract } from "./balance";
import { easterSunday, holidaysForYear, DEFAULT_HOLIDAY_IDS } from "./holidays";
import { addMonths, shiftHours } from "./dates";
import type { Entry } from "./types";

const contract: Contract = {
  startDate: "2026-09-14",
  weeklyHours: 33.5,
  workDays: [1, 2, 3, 4, 5],
  vacationWeeks: 5,
  enabledHolidays: DEFAULT_HOLIDAY_IDS,
  customHolidays: [],
};

let n = 0;
function entry(date: string, partial: Partial<Entry> = {}): Entry {
  return {
    id: String(n++),
    date,
    type: "work",
    start: null,
    end: null,
    breakMinutes: 0,
    hours: null,
    note: "",
    status: "approved",
    createdBy: "nanny",
    createdAt: date,
    ...partial,
  };
}

describe("dates & holidays", () => {
  it("computes Easter", () => {
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
  });
  it("lists the default Fribourg (Lac) holidays", () => {
    const h = holidaysForYear(2027, DEFAULT_HOLIDAY_IDS);
    expect([...h.keys()].sort()).toEqual([
      "2027-01-01", "2027-01-02", "2027-03-26", "2027-03-29", "2027-05-06",
      "2027-05-17", "2027-08-01", "2027-12-25", "2027-12-26",
    ]);
  });
  it("handles shifts across midnight and breaks", () => {
    expect(shiftHours("07:00", "12:30", 30)).toBe(5);
    expect(shiftHours("22:00", "01:00")).toBe(3);
  });
  it("adds months without overflowing", () => {
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
  });
});

describe("hours account", () => {
  it("uses 6.7 h per day for 33.5 h over 5 days", () => {
    expect(dailyTarget(contract)).toBeCloseTo(6.7);
  });

  it("counts due hours from the start date, skipping weekends", () => {
    // Mon 14.9. – Fri 18.9.2026 = 5 days
    expect(dueBetween("2026-09-01", "2026-09-20", contract)).toBeCloseTo(33.5);
  });

  it("credits vacation and sick days with the daily target", () => {
    expect(entryHours(entry("2026-09-14", { type: "vacation" }), contract)).toBeCloseTo(6.7);
    expect(entryHours(entry("2026-09-14", { type: "sick", hours: 3.35 }), contract)).toBeCloseTo(3.35);
    expect(entryHours(entry("2026-09-14", { start: "08:00", end: "12:00", breakMinutes: 15 }), contract)).toBe(3.75);
  });

  it("balances flexible weeks: long days offset free days", () => {
    const entries = [
      entry("2026-09-14", { hours: 10 }),
      entry("2026-09-15", { hours: 10 }),
      entry("2026-09-16", { hours: 10 }),
      entry("2026-09-17", { hours: 3.5 }),
      // Friday off
    ];
    const acc = computeAccount(entries, contract, "2026-09-20");
    expect(acc.due).toBeCloseTo(33.5);
    expect(acc.balance).toBeCloseTo(0);
  });

  it("leaves minus hours when the family is away (contract §10)", () => {
    const acc = computeAccount([], contract, "2026-09-18");
    // nothing logged today → today is not due yet
    expect(acc.balance).toBeCloseTo(-26.8);
  });

  it("flags overtime older than three months (FIFO)", () => {
    const entries = [entry("2026-09-14", { hours: 16.7 })]; // +10 h
    // then exactly the due hours every workday afterwards
    for (let d = new Date(Date.UTC(2026, 8, 15)); d <= new Date(Date.UTC(2027, 0, 29)); d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const wd = d.getUTCDay();
      if (wd === 0 || wd === 6 || iso === "2026-12-25" || iso === "2027-01-01") continue;
      entries.push(entry(iso, { hours: 6.7 }));
    }
    const acc = computeAccount(entries, contract, "2027-01-29");
    expect(acc.balance).toBeCloseTo(10);
    expect(acc.lots).toEqual([{ date: "2026-09-14", hours: 10 }]);
    expect(acc.overdue3m).toBe(10);
    expect(acc.overdue12m).toBe(0);
  });

  it("pays out overtime from the oldest lot first", () => {
    const entries = [
      entry("2026-09-14", { hours: 8.7 }), // +2
      entry("2026-09-15", { hours: 9.7 }), // +3
      entry("2026-09-16", { type: "adjustment", hours: -2 }),
      entry("2026-09-16", { hours: 6.7 }),
    ];
    const acc = computeAccount(entries, contract, "2026-09-16");
    expect(acc.balance).toBeCloseTo(3);
    expect(acc.lots).toEqual([{ date: "2026-09-15", hours: 3 }]);
  });
});

describe("year summary", () => {
  it("prorates vacation in the first year", () => {
    // 14.9.–31.12.2026 = 109 of 365 days → 7.47 → 7.5 days
    expect(vacationEntitlement(2026, contract)).toBe(7.5);
    expect(vacationEntitlement(2027, contract)).toBe(25);
  });

  it("computes the 2027 annual budget", () => {
    const y = yearSummary([], contract, 2027, "2027-01-01");
    // 261 weekdays − 5 holidays on weekdays = 256 workdays × 6.7 h = 1715.2 h, minus 25 × 6.7 h vacation
    expect(y.workdays).toBe(256);
    expect(y.budgetHours).toBeCloseTo(1547.7);
  });

  it("computes the hourly rate for payouts", () => {
    expect(hourlyRate({ monthlySalary: 4365, weeklyHours: 33.5 })).toBeCloseTo(30.07, 2);
  });
});
