"use client";

import { useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { CATEGORY_STYLE } from "@/lib/categories";
import { fmtDate, weekdayNames } from "@/lib/format";
import type { CalendarEvent, Child } from "@/lib/types";
import { useLang, useT } from "./i18n";
import { Modal } from "./modal";
import { EventForm } from "./event-form";

export interface CalendarDay {
  date: string;
  inMonth: boolean;
  holiday?: string;
  eventIds: string[];
}

type Editing = { event?: CalendarEvent; date: string } | null;

export function CalendarBoard({ days, events, kids, today }: { days: CalendarDay[]; events: CalendarEvent[]; kids: Child[]; today: string }) {
  const t = useT();
  const lang = useLang();
  const [editing, setEditing] = useState<Editing>(null);
  const byId = new Map(events.map((e) => [e.id, e]));
  const wd = weekdayNames(lang, "short");
  const kidsOf = (e: CalendarEvent) => kids.filter((k) => e.childIds.includes(k.id)).map((k) => k.emoji).join("");

  // in the list, a multi-day event appears once (on its first visible day) with its date range
  const listed = new Set<string>();
  const agenda = days
    .filter((d) => d.inMonth)
    .map((d) => ({
      ...d,
      eventIds: d.eventIds.filter((id) => {
        const e = byId.get(id);
        if (!e || e.repeat === "weekly" || e.startDate === e.endDate) return true;
        if (listed.has(id)) return false;
        listed.add(id);
        return true;
      }),
    }))
    .filter((d) => d.eventIds.length || d.holiday);
  const defaultDate = today >= days[0].date && today <= days[days.length - 1].date ? today : days.find((d) => d.inMonth)!.date;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => setEditing({ date: defaultDate })}>
          <Plus className="size-5" strokeWidth={3} /> {t("calendar.add")}
        </button>
      </div>

      <div className="card p-2 sm:p-4">
        <div className="grid grid-cols-7 pb-2 text-center text-xs font-extrabold tracking-wide text-ink-soft uppercase">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i}>{wd[i]}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const isToday = d.date === today;
            const evs = d.eventIds.map((id) => byId.get(id)!).filter(Boolean);
            const band = evs.find((e) => e.category === "family_away" || e.category === "school_holiday" || e.category === "nanny_off");
            return (
              <div
                key={d.date}
                role="button"
                tabIndex={0}
                onClick={() => setEditing({ date: d.date })}
                onKeyDown={(e) => e.key === "Enter" && setEditing({ date: d.date })}
                className={`group flex min-h-16 cursor-pointer flex-col gap-0.5 rounded-xl p-1 text-left transition hover:ring-2 hover:ring-coral/30 sm:min-h-28 sm:p-1.5 ${
                  d.inMonth ? (band ? CATEGORY_STYLE[band.category].bg : "bg-cream/60") : "opacity-40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`grid size-6 place-items-center rounded-full text-xs font-extrabold ${isToday ? "bg-coral text-white" : d.holiday ? "text-lilac" : ""}`}>
                    {Number(d.date.slice(8))}
                  </span>
                  {d.holiday && <span className="hidden truncate text-[10px] font-bold text-lilac sm:inline">🎉</span>}
                </div>
                {d.holiday && <div className="hidden truncate text-[10px] font-bold text-lilac sm:block">{d.holiday}</div>}
                {/* chips on larger screens, dots on phones */}
                <div className="hidden flex-col gap-0.5 sm:flex">
                  {evs.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setEditing({ event: e, date: d.date });
                      }}
                      className={`truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-bold ${CATEGORY_STYLE[e.category].bg} ${CATEGORY_STYLE[e.category].fg} ring-1 ring-white`}
                    >
                      {e.startTime ? `${e.startTime} ` : CATEGORY_STYLE[e.category].emoji + " "}
                      {e.title}
                    </button>
                  ))}
                  {evs.length > 3 && <span className="px-1 text-[10px] font-bold text-ink-soft">{t("calendar.more", { count: evs.length - 3 })}</span>}
                </div>
                <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                  {evs.slice(0, 4).map((e) => (
                    <span key={e.id} className={`size-1.5 rounded-full ${CATEGORY_STYLE[e.category].dot}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-black">{t("calendar.agenda")}</h2>
        {agenda.length === 0 ? (
          <div className="card text-center text-ink-soft">{t("calendar.empty")}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {agenda.map((d) => (
              <div key={d.date} className="card flex gap-4 p-3">
                <div className={`flex w-12 shrink-0 flex-col items-center justify-center rounded-2xl py-1 ${d.date === today ? "bg-coral text-white" : "bg-cream"}`}>
                  <span className="text-[10px] font-extrabold uppercase">{wd[new Date(d.date + "T00:00:00Z").getUTCDay() || 7]}</span>
                  <span className="text-xl leading-none font-black">{Number(d.date.slice(8))}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {d.holiday && <div className="text-sm font-bold text-lilac">🎉 {d.holiday}</div>}
                  {d.eventIds.map((id) => {
                    const e = byId.get(id)!;
                    const s = CATEGORY_STYLE[e.category];
                    return (
                      <button key={id} onClick={() => setEditing({ event: e, date: d.date })} className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left ${s.bg}`}>
                        <span>{s.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{e.title}</span>
                          <span className={`block truncate text-xs font-semibold ${s.fg}`}>
                            {t(`cat.${e.category}`)}
                            {e.startTime && ` · ${e.startTime}${e.endTime ? `–${e.endTime}` : ""}`}
                            {e.startDate !== e.endDate && ` · ${fmtDate(e.startDate, lang)} – ${fmtDate(e.endDate, lang)}`}
                            {e.note && <span className="text-ink-soft"> · {e.note}</span>}
                          </span>
                        </span>
                        {e.repeat === "weekly" && <Repeat className="size-3.5 shrink-0 text-ink-soft" />}
                        <span className="shrink-0">{kidsOf(e)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.event ? t("calendar.edit") : t("calendar.add")}>
        {editing && <EventForm key={editing.event?.id ?? editing.date} event={editing.event} date={editing.date} kids={kids} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}
