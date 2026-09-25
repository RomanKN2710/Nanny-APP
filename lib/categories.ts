import type { EventCategory, ScheduleKind } from "./types";

export const CATEGORY_STYLE: Record<EventCategory, { emoji: string; bg: string; fg: string; dot: string }> = {
  appointment: { emoji: "🩺", bg: "bg-sky-soft", fg: "text-sky", dot: "bg-sky" },
  school: { emoji: "🏫", bg: "bg-lilac-soft", fg: "text-lilac", dot: "bg-lilac" },
  activity: { emoji: "⚽", bg: "bg-mint-soft", fg: "text-mint", dot: "bg-mint" },
  birthday: { emoji: "🎂", bg: "bg-rose-soft", fg: "text-rose", dot: "bg-rose" },
  nanny_off: { emoji: "🌴", bg: "bg-sun-soft", fg: "text-[#9a7317]", dot: "bg-sun" },
  family_away: { emoji: "🧳", bg: "bg-coral-soft", fg: "text-coral", dot: "bg-coral" },
  school_holiday: { emoji: "🎒", bg: "bg-sun-soft", fg: "text-[#9a7317]", dot: "bg-sun" },
  other: { emoji: "📌", bg: "bg-cream", fg: "text-ink-soft", dot: "bg-ink-soft" },
};

export const CATEGORIES = Object.keys(CATEGORY_STYLE) as EventCategory[];

export const KIND_EMOJI: Record<ScheduleKind, string> = {
  school: "🏫",
  activity: "⚽",
  care: "🧺",
  other: "📌",
};
