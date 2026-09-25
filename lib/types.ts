import type { CustomHoliday, Lang } from "./holidays";

export type Role = "parent" | "nanny";

/**
 * work       – hours actually worked (start/end/break, or a plain number of hours)
 * vacation   – paid vacation; credits the normal daily hours (or a part of them)
 * sick       – sick day; credits the normal daily hours (salary continues, contract §9)
 * adjustment – manual correction in hours (+/-), e.g. overtime paid out (-) or an opening balance
 */
export type EntryType = "work" | "vacation" | "sick" | "adjustment";
export type EntryStatus = "pending" | "approved";

export interface Entry {
  id: string;
  date: string;
  type: EntryType;
  start: string | null;
  end: string | null;
  breakMinutes: number;
  /** Explicit hours. Used when no start/end is given; for vacation/sick null = a full day. */
  hours: number | null;
  note: string;
  status: EntryStatus;
  createdBy: Role;
  createdAt: string;
}

export type EventCategory =
  | "appointment"
  | "school"
  | "activity"
  | "birthday"
  | "nanny_off"
  | "family_away"
  | "school_holiday"
  | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  category: EventCategory;
  childIds: string[];
  /** "weekly" repeats on the weekday of startDate until repeatUntil (or forever). */
  repeat: "none" | "weekly";
  repeatUntil: string | null;
  note: string;
  createdBy: Role;
}

export type ScheduleKind = "school" | "activity" | "care" | "other";

export interface ScheduleItem {
  id: string;
  childId: string;
  weekday: number; // 1 = Monday … 7 = Sunday
  start: string;
  end: string;
  title: string;
  kind: ScheduleKind;
  location: string;
  /** Who drops off / picks up, what to bring, … */
  note: string;
}

export interface Child {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface Settings {
  familyName: string;
  nannyName: string;
  startDate: string;
  weeklyHours: number;
  workDays: number[];
  vacationWeeks: number;
  monthlySalary: number;
  currency: string;
  enabledHolidays: string[];
  customHolidays: CustomHoliday[];
  children: Child[];
  defaultLang: Lang;
}
