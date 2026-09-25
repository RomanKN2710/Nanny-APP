"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPin, createSession, destroySession, requireParent, requireRole } from "@/lib/auth";
import { LANG_COOKIE } from "@/lib/context";
import { isHHMM, isISODate, nowHHMM, todayISO } from "@/lib/dates";
import { isLang, type Key } from "@/lib/i18n";
import { HOLIDAYS } from "@/lib/holidays";
import * as repo from "@/lib/repo";
import type { CalendarEvent, Child, Entry, EntryType, EventCategory, Role, ScheduleItem, ScheduleKind, Settings } from "@/lib/types";

export type FormState = { error?: Key; ok?: boolean } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => {
  const v = str(fd, k).replace(",", ".").replace("−", "-");
  return v === "" ? NaN : Number(v);
};
const newId = () => crypto.randomUUID();

function refreshAll() {
  revalidatePath("/", "layout");
}

// ---------- session ----------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const role = str(fd, "role");
  if (role !== "parent" && role !== "nanny") return { error: "err.invalid" };
  if (!checkPin(role, str(fd, "pin"))) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return { error: "login.wrong" };
  }
  await createSession(role);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function setLanguage(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 365 * 86_400, sameSite: "lax" });
  refreshAll();
}

// ---------- hours ----------

function statusFor(role: Role): Entry["status"] {
  return role === "parent" ? "approved" : "pending";
}

export async function startShift(): Promise<FormState> {
  const role = await requireRole();
  if (await repo.findRunningEntry()) return { error: "err.running" };
  await repo.upsertEntry({
    id: newId(),
    date: todayISO(),
    type: "work",
    start: nowHHMM(),
    end: null,
    breakMinutes: 0,
    hours: null,
    note: "",
    status: statusFor(role),
    createdBy: role,
    createdAt: new Date().toISOString(),
  });
  refreshAll();
  return { ok: true };
}

export async function stopShift(fd: FormData) {
  await requireRole();
  const running = await repo.findRunningEntry();
  if (!running) return;
  const breakMinutes = Math.max(0, Math.min(600, Math.round(num(fd, "breakMinutes") || 0)));
  const end = nowHHMM();
  // started by mistake and stopped within the same minute → just drop it
  if (running.date === todayISO() && end === running.start) await repo.deleteEntry(running.id);
  else await repo.upsertEntry({ ...running, end, breakMinutes });
  refreshAll();
}

export async function saveEntry(_: FormState, fd: FormData): Promise<FormState> {
  const role = await requireRole();
  const id = str(fd, "id");
  const existing = id ? await repo.getEntry(id) : null;
  if (id && !existing) return { error: "err.invalid" };
  if (existing && role === "nanny" && existing.status === "approved") return { error: "err.locked" };

  const type = str(fd, "type") as EntryType;
  if (!["work", "vacation", "sick", "adjustment"].includes(type)) return { error: "err.invalid" };
  if (type === "adjustment" && role !== "parent") return { error: "err.forbidden" };

  const date = str(fd, "date");
  if (!isISODate(date)) return { error: "err.invalid" };

  let start: string | null = null;
  let end: string | null = null;
  let breakMinutes = 0;
  let hours: number | null = null;

  if (type === "work") {
    if (str(fd, "mode") === "hours") {
      hours = num(fd, "hours");
      if (!(hours > 0 && hours <= 24)) return { error: "err.invalid" };
    } else {
      start = str(fd, "start");
      end = str(fd, "end") || null;
      breakMinutes = Math.round(num(fd, "breakMinutes") || 0);
      if (!isHHMM(start) || (end !== null && !isHHMM(end)) || breakMinutes < 0 || breakMinutes > 600) {
        return { error: "err.invalid" };
      }
    }
  } else if (type === "vacation" || type === "sick") {
    const portion = str(fd, "portion");
    if (portion === "full") hours = null;
    else {
      hours = num(fd, "hours");
      if (!(hours > 0 && hours <= 24)) return { error: "err.invalid" };
    }
  } else {
    hours = num(fd, "hours");
    if (!Number.isFinite(hours) || hours === 0 || Math.abs(hours) > 2000) return { error: "err.invalid" };
  }

  await repo.upsertEntry({
    id: existing?.id ?? newId(),
    date,
    type,
    start,
    end,
    breakMinutes,
    hours,
    note: str(fd, "note").slice(0, 500),
    // a nanny edit always needs a new confirmation
    status: statusFor(role),
    createdBy: existing?.createdBy ?? role,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });
  refreshAll();
  return { ok: true };
}

export async function deleteEntry(fd: FormData) {
  const role = await requireRole();
  const entry = await repo.getEntry(str(fd, "id"));
  if (!entry) return;
  if (role === "nanny" && entry.status === "approved") throw new Error("Confirmed entries can only be deleted by a parent");
  await repo.deleteEntry(entry.id);
  refreshAll();
}

export async function approveEntries(fd: FormData) {
  await requireParent();
  const ids = str(fd, "ids").split(",").filter(Boolean);
  await repo.setEntryStatus(ids, "approved");
  refreshAll();
}

// ---------- calendar ----------

const CATEGORIES: EventCategory[] = ["appointment", "school", "activity", "birthday", "nanny_off", "family_away", "school_holiday", "other"];

export async function saveEvent(_: FormState, fd: FormData): Promise<FormState> {
  const role = await requireRole();
  const title = str(fd, "title").slice(0, 120);
  const category = str(fd, "category") as EventCategory;
  const startDate = str(fd, "startDate");
  const weekly = fd.get("repeat") === "on";
  // weekly events are single-day; a multi-day span would repeat into overlapping copies
  const endDate = weekly ? startDate : str(fd, "endDate") || startDate;
  const allDay = fd.get("allDay") === "on";
  const startTime = allDay ? null : str(fd, "startTime") || null;
  const endTime = allDay ? null : str(fd, "endTime") || null;
  const repeat = weekly ? "weekly" : "none";
  const repeatUntil = repeat === "weekly" ? str(fd, "repeatUntil") || null : null;

  if (!title || !CATEGORIES.includes(category) || !isISODate(startDate) || !isISODate(endDate) || endDate < startDate) {
    return { error: "err.invalid" };
  }
  if ((startTime && !isHHMM(startTime)) || (endTime && !isHHMM(endTime))) return { error: "err.invalid" };
  if (repeatUntil && (!isISODate(repeatUntil) || repeatUntil < startDate)) return { error: "err.invalid" };

  const id = str(fd, "id");
  await repo.upsertEvent({
    id: id || newId(),
    title,
    startDate,
    endDate,
    startTime,
    endTime,
    category,
    childIds: fd.getAll("childIds").map(String),
    repeat,
    repeatUntil,
    note: str(fd, "note").slice(0, 1000),
    createdBy: role,
  } satisfies CalendarEvent);
  refreshAll();
  return { ok: true };
}

export async function deleteEvent(fd: FormData) {
  await requireRole();
  await repo.deleteEvent(str(fd, "id"));
  refreshAll();
}

// ---------- school & activities ----------

const KINDS: ScheduleKind[] = ["school", "activity", "care", "other"];

export async function saveScheduleItem(_: FormState, fd: FormData): Promise<FormState> {
  await requireRole();
  const id = str(fd, "id");
  const weekdays = fd.getAll("weekday").map(Number).filter((d) => d >= 1 && d <= 7);
  const base = {
    childId: str(fd, "childId"),
    start: str(fd, "start"),
    end: str(fd, "end"),
    title: str(fd, "title").slice(0, 120),
    kind: str(fd, "kind") as ScheduleKind,
    location: str(fd, "location").slice(0, 200),
    note: str(fd, "note").slice(0, 500),
  };
  if (!base.childId || !base.title || !KINDS.includes(base.kind) || !isHHMM(base.start) || !isHHMM(base.end) || !weekdays.length) {
    return { error: "err.invalid" };
  }
  if (id) {
    // editing keeps one item on one weekday
    await repo.upsertScheduleItem({ id, weekday: weekdays[0], ...base } satisfies ScheduleItem);
  } else {
    for (const weekday of weekdays) await repo.upsertScheduleItem({ id: newId(), weekday, ...base });
  }
  refreshAll();
  return { ok: true };
}

export async function deleteScheduleItem(fd: FormData) {
  await requireRole();
  await repo.deleteScheduleItem(str(fd, "id"));
  refreshAll();
}

// ---------- settings ----------

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireParent();
  const current = await repo.getSettings();

  const children: Child[] = [];
  const childIds = fd.getAll("childId").map(String);
  childIds.forEach((id, i) => {
    const name = String(fd.getAll("childName")[i] ?? "").trim();
    if (!name || fd.getAll("childRemove").map(String).includes(id)) return;
    children.push({
      id,
      name: name.slice(0, 40),
      emoji: String(fd.getAll("childEmoji")[i] ?? "").trim().slice(0, 4) || "🙂",
      color: String(fd.getAll("childColor")[i] ?? "#7DB7E8"),
    });
  });
  const newChild = str(fd, "newChildName");
  if (newChild) {
    children.push({ id: newId(), name: newChild.slice(0, 40), emoji: str(fd, "newChildEmoji").slice(0, 4) || "🙂", color: str(fd, "newChildColor") || "#B39DDB" });
  }

  const customHolidays = current.customHolidays.filter((h) => !fd.getAll("removeCustom").map(String).includes(h.date));
  const newDate = str(fd, "customDate");
  if (isISODate(newDate)) customHolidays.push({ date: newDate, name: str(fd, "customName").slice(0, 60) || "—" });
  customHolidays.sort((a, b) => a.date.localeCompare(b.date));

  const defaultLang = str(fd, "defaultLang");
  const next: Settings = {
    ...current,
    familyName: str(fd, "familyName").slice(0, 60) || current.familyName,
    nannyName: str(fd, "nannyName").slice(0, 60) || current.nannyName,
    startDate: isISODate(str(fd, "startDate")) ? str(fd, "startDate") : current.startDate,
    weeklyHours: num(fd, "weeklyHours"),
    workDays: fd.getAll("workDays").map(Number).filter((d) => d >= 1 && d <= 7).sort(),
    vacationWeeks: num(fd, "vacationWeeks"),
    monthlySalary: num(fd, "monthlySalary"),
    currency: (str(fd, "currency") || "CHF").toUpperCase().slice(0, 3),
    enabledHolidays: fd.getAll("holidays").map(String).filter((id) => HOLIDAYS.some((h) => h.id === id)),
    customHolidays,
    children,
    defaultLang: isLang(defaultLang) ? defaultLang : current.defaultLang,
  };
  if (!(next.weeklyHours > 0 && next.weeklyHours <= 60) || !next.workDays.length || !(next.vacationWeeks >= 0 && next.vacationWeeks <= 10) || !(next.monthlySalary >= 0)) {
    return { error: "err.invalid" };
  }
  await repo.saveSettings(next);
  refreshAll();
  return { ok: true };
}
