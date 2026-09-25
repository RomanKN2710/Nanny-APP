import { Repeat } from "lucide-react";
import { CATEGORY_STYLE } from "@/lib/categories";
import type { CalendarEvent, Child } from "@/lib/types";

export function EventChip({ event, kids: allKids, label }: { event: CalendarEvent; kids: Child[]; label: string }) {
  const style = CATEGORY_STYLE[event.category];
  const kids = allKids.filter((c) => event.childIds.includes(c.id));
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${style.bg}`}>
      <span className="text-lg">{style.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold">{event.title}</div>
        <div className={`truncate text-xs font-semibold ${style.fg}`}>
          {label}
          {event.startTime && ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ""}`}
          {event.note && <span className="text-ink-soft"> · {event.note}</span>}
        </div>
      </div>
      {event.repeat === "weekly" && <Repeat className="size-3.5 text-ink-soft" />}
      {kids.length > 0 && <span className="text-sm">{kids.map((k) => k.emoji).join("")}</span>}
    </div>
  );
}
