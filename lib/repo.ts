import "server-only";
import { db } from "./db";
import { DEFAULT_SETTINGS } from "./defaults";
import type { CalendarEvent, Entry, ScheduleItem, Settings } from "./types";

// ---------- settings ----------

export async function getSettings(): Promise<Settings> {
  const q = await db();
  const rows = await q<{ value: Partial<Settings> }>("select value from kv where key = 'settings'");
  return { ...DEFAULT_SETTINGS, ...(rows[0]?.value ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const q = await db();
  await q(
    "insert into kv (key, value) values ('settings', $1::jsonb) on conflict (key) do update set value = excluded.value",
    [JSON.stringify(settings)],
  );
}

// ---------- entries ----------

type EntryRow = {
  id: string;
  date: string;
  type: Entry["type"];
  start_time: string | null;
  end_time: string | null;
  break_minutes: number;
  hours: number | null;
  note: string;
  status: Entry["status"];
  created_by: Entry["createdBy"];
  created_at: string;
};

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  date: r.date,
  type: r.type,
  start: r.start_time,
  end: r.end_time,
  breakMinutes: Number(r.break_minutes),
  hours: r.hours == null ? null : Number(r.hours),
  note: r.note,
  status: r.status,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

export async function listEntries(from?: string, to?: string): Promise<Entry[]> {
  const q = await db();
  const rows = await q<EntryRow>(
    "select * from entries where ($1::text is null or date >= $1) and ($2::text is null or date <= $2) order by date, start_time nulls last, created_at",
    [from ?? null, to ?? null],
  );
  return rows.map(toEntry);
}

export async function getEntry(id: string): Promise<Entry | null> {
  const q = await db();
  const rows = await q<EntryRow>("select * from entries where id = $1", [id]);
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function findRunningEntry(): Promise<Entry | null> {
  const q = await db();
  const rows = await q<EntryRow>(
    "select * from entries where type = 'work' and start_time is not null and end_time is null and hours is null order by date desc limit 1",
  );
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function upsertEntry(e: Entry): Promise<void> {
  const q = await db();
  await q(
    `insert into entries (id, date, type, start_time, end_time, break_minutes, hours, note, status, created_by, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (id) do update set date = excluded.date, type = excluded.type, start_time = excluded.start_time,
       end_time = excluded.end_time, break_minutes = excluded.break_minutes, hours = excluded.hours,
       note = excluded.note, status = excluded.status`,
    [e.id, e.date, e.type, e.start, e.end, e.breakMinutes, e.hours, e.note, e.status, e.createdBy, e.createdAt],
  );
}

export async function setEntryStatus(ids: string[], status: Entry["status"]): Promise<void> {
  if (!ids.length) return;
  const q = await db();
  await q("update entries set status = $1 where id = any($2::text[])", [status, ids]);
}

export async function deleteEntry(id: string): Promise<void> {
  const q = await db();
  await q("delete from entries where id = $1", [id]);
}

// ---------- calendar events ----------

type EventRow = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  category: CalendarEvent["category"];
  child_ids: string[] | string;
  repeat: CalendarEvent["repeat"];
  repeat_until: string | null;
  note: string;
  created_by: CalendarEvent["createdBy"];
};

const toEvent = (r: EventRow): CalendarEvent => ({
  id: r.id,
  title: r.title,
  startDate: r.start_date,
  endDate: r.end_date,
  startTime: r.start_time,
  endTime: r.end_time,
  category: r.category,
  childIds: typeof r.child_ids === "string" ? JSON.parse(r.child_ids) : r.child_ids,
  repeat: r.repeat,
  repeatUntil: r.repeat_until,
  note: r.note,
  createdBy: r.created_by,
});

/** Events that may touch [from, to] (recurring events are expanded by the caller). */
export async function listEvents(from: string, to: string): Promise<CalendarEvent[]> {
  const q = await db();
  const rows = await q<EventRow>(
    `select * from events
     where start_date <= $2 and (end_date >= $1 or (repeat = 'weekly' and (repeat_until is null or repeat_until >= $1)))
     order by start_date, start_time nulls first`,
    [from, to],
  );
  return rows.map(toEvent);
}

export async function upsertEvent(e: CalendarEvent): Promise<void> {
  const q = await db();
  await q(
    `insert into events (id, title, start_date, end_date, start_time, end_time, category, child_ids, repeat, repeat_until, note, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)
     on conflict (id) do update set title = excluded.title, start_date = excluded.start_date, end_date = excluded.end_date,
       start_time = excluded.start_time, end_time = excluded.end_time, category = excluded.category,
       child_ids = excluded.child_ids, repeat = excluded.repeat, repeat_until = excluded.repeat_until, note = excluded.note`,
    [e.id, e.title, e.startDate, e.endDate, e.startTime, e.endTime, e.category, JSON.stringify(e.childIds), e.repeat, e.repeatUntil, e.note, e.createdBy],
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const q = await db();
  await q("delete from events where id = $1", [id]);
}

// ---------- school & activity schedule ----------

type ScheduleRow = {
  id: string;
  child_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  title: string;
  kind: ScheduleItem["kind"];
  location: string;
  note: string;
};

const toSchedule = (r: ScheduleRow): ScheduleItem => ({
  id: r.id,
  childId: r.child_id,
  weekday: Number(r.weekday),
  start: r.start_time,
  end: r.end_time,
  title: r.title,
  kind: r.kind,
  location: r.location,
  note: r.note,
});

export async function listSchedule(): Promise<ScheduleItem[]> {
  const q = await db();
  const rows = await q<ScheduleRow>("select * from schedule_items order by weekday, start_time");
  return rows.map(toSchedule);
}

export async function upsertScheduleItem(s: ScheduleItem): Promise<void> {
  const q = await db();
  await q(
    `insert into schedule_items (id, child_id, weekday, start_time, end_time, title, kind, location, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     on conflict (id) do update set child_id = excluded.child_id, weekday = excluded.weekday, start_time = excluded.start_time,
       end_time = excluded.end_time, title = excluded.title, kind = excluded.kind, location = excluded.location, note = excluded.note`,
    [s.id, s.childId, s.weekday, s.start, s.end, s.title, s.kind, s.location, s.note],
  );
}

export async function deleteScheduleItem(id: string): Promise<void> {
  const q = await db();
  await q("delete from schedule_items where id = $1", [id]);
}
