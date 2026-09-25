import { describe, expect, it } from "vitest";
import { occurrencesInRange } from "./calendar";
import type { CalendarEvent } from "./types";

const base: CalendarEvent = {
  id: "e",
  title: "Swimming",
  startDate: "2026-09-02",
  endDate: "2026-09-02",
  startTime: "16:00",
  endTime: "17:00",
  category: "activity",
  childIds: [],
  repeat: "none",
  repeatUntil: null,
  note: "",
  createdBy: "parent",
};

describe("occurrencesInRange", () => {
  it("expands weekly events within the range and until date", () => {
    const occ = occurrencesInRange([{ ...base, repeat: "weekly", repeatUntil: "2026-10-10" }], "2026-09-15", "2026-10-31");
    expect(occ.map((o) => o.date)).toEqual(["2026-09-16", "2026-09-23", "2026-09-30", "2026-10-07"]);
  });

  it("shows multi-day events on each day, clipped to the range", () => {
    const occ = occurrencesInRange([{ ...base, startDate: "2026-09-28", endDate: "2026-10-03" }], "2026-10-01", "2026-10-31");
    expect(occ.map((o) => o.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(occ[0].occurrenceStart).toBe("2026-09-28");
  });

  it("ignores events outside the range", () => {
    expect(occurrencesInRange([base], "2026-10-01", "2026-10-31")).toEqual([]);
  });
});
