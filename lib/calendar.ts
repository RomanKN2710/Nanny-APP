import { addDays, diffDays, maxISO, minISO } from "./dates";
import type { CalendarEvent } from "./types";

export interface Occurrence {
  event: CalendarEvent;
  /** Day this occurrence is shown on. */
  date: string;
  /** First day of this particular occurrence (differs from date for multi-day events). */
  occurrenceStart: string;
}

/** Expand events (multi-day and weekly repeating) into one item per visible day in [from, to]. */
export function occurrencesInRange(events: CalendarEvent[], from: string, to: string): Occurrence[] {
  const out: Occurrence[] = [];
  for (const event of events) {
    const span = Math.max(0, diffDays(event.startDate, event.endDate));
    const starts: string[] = [];
    if (event.repeat === "weekly") {
      const until = minISO(event.repeatUntil ?? to, to);
      // jump to the first occurrence that could still reach `from`
      const skipWeeks = Math.max(0, Math.floor((diffDays(event.startDate, from) - span) / 7));
      for (let s = addDays(event.startDate, skipWeeks * 7); s <= until; s = addDays(s, 7)) starts.push(s);
    } else {
      starts.push(event.startDate);
    }
    for (const s of starts) {
      const e = addDays(s, span);
      if (e < from || s > to) continue;
      for (let d = maxISO(s, from); d <= minISO(e, to); d = addDays(d, 1)) {
        out.push({ event, date: d, occurrenceStart: s });
      }
    }
  }
  return out.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.event.startTime ?? "").localeCompare(b.event.startTime ?? "") ||
      a.event.title.localeCompare(b.event.title),
  );
}
