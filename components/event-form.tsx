"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent, saveEvent } from "@/app/actions";
import { CATEGORIES, CATEGORY_STYLE } from "@/lib/categories";
import { addDays, diffDays, isISODate } from "@/lib/dates";
import type { CalendarEvent, Child, EventCategory } from "@/lib/types";
import { useT } from "./i18n";

export function EventForm({ event, date, kids, onDone }: { event?: CalendarEvent; date: string; kids: Child[]; onDone: () => void }) {
  const t = useT();
  const [state, action, pending] = useActionState(saveEvent, undefined);
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "appointment");
  const [allDay, setAllDay] = useState(event ? !event.startTime : false);
  const [repeat, setRepeat] = useState(event?.repeat === "weekly");
  const [startDate, setStartDate] = useState(event?.startDate ?? date);
  const [endDate, setEndDate] = useState(event?.endDate ?? date);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        {event && <input type="hidden" name="id" value={event.id} />}
        <input type="hidden" name="category" value={category} />

        <div className="field">
          <label htmlFor="title">{t("event.title")}</label>
          <input id="title" name="title" required maxLength={120} defaultValue={event?.title} autoFocus={!event} />
        </div>

        <div className="field">
          <label>{t("event.category")}</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  if (c === "family_away" || c === "school_holiday" || c === "nanny_off" || c === "birthday") setAllDay(true);
                }}
                className={`chip border-2 py-1 text-sm transition ${category === c ? `${CATEGORY_STYLE[c].bg} ${CATEGORY_STYLE[c].fg} border-current` : "border-line bg-white text-ink-soft"}`}
              >
                {CATEGORY_STYLE[c].emoji} {t(`cat.${c}`)}
              </button>
            ))}
          </div>
          {category === "family_away" && <p className="rounded-xl bg-coral-soft px-3 py-2 text-xs font-semibold text-coral">{t("cat.family_away.hint")}</p>}
        </div>

        <div className={`grid gap-2 ${repeat ? "grid-cols-1" : "grid-cols-2"}`}>
          <div className="field">
            <label htmlFor="startDate">{t("event.from")}</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                // keep the event's length when moving its start
                const span = startDate && endDate ? diffDays(startDate, endDate) : 0;
                setStartDate(e.target.value);
                if (isISODate(e.target.value)) setEndDate(addDays(e.target.value, Math.max(0, span)));
              }}
            />
          </div>
          {!repeat && (
            <div className="field">
              <label htmlFor="endDate">{t("event.to")}</label>
              <input id="endDate" name="endDate" type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-ink">
          <input type="checkbox" name="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> {t("event.allDay")}
        </label>
        {!allDay && (
          <div className="grid grid-cols-2 gap-2">
            <div className="field">
              <label htmlFor="startTime">{t("event.startTime")}</label>
              <input id="startTime" name="startTime" type="time" defaultValue={event?.startTime ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="endTime">{t("event.endTime")}</label>
              <input id="endTime" name="endTime" type="time" defaultValue={event?.endTime ?? ""} />
            </div>
          </div>
        )}

        {kids.length > 0 && (
          <div className="field">
            <label>{t("event.children")}</label>
            <div className="flex flex-wrap gap-2">
              {kids.map((k) => (
                <label key={k.id} className="chip cursor-pointer border-2 border-line bg-white py-1 text-sm text-ink has-[:checked]:border-current has-[:checked]:bg-cream" style={{ color: k.color }}>
                  <input type="checkbox" name="childIds" value={k.id} defaultChecked={event?.childIds.includes(k.id)} className="sr-only" />
                  {k.emoji} <span className="text-ink">{k.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-ink">
          <input type="checkbox" name="repeat" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> {t("event.repeat")}
        </label>
        {repeat && (
          <div className="field">
            <label htmlFor="repeatUntil">{t("event.repeatUntil")}</label>
            <input id="repeatUntil" name="repeatUntil" type="date" min={startDate} defaultValue={event?.repeatUntil ?? ""} />
          </div>
        )}

        <div className="field">
          <label htmlFor="note">{t("event.note")}</label>
          <textarea id="note" name="note" rows={2} maxLength={1000} defaultValue={event?.note} />
        </div>

        {state?.error && <p className="text-sm font-semibold text-coral">{t(state.error)}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onDone}>
            {t("common.cancel")}
          </button>
          <button className="btn-primary" disabled={pending}>
            {t("common.save")}
          </button>
        </div>
      </form>

      {event && (
        <form
          action={async (fd) => {
            await deleteEvent(fd);
            onDone();
          }}
          className="border-t border-line pt-3"
        >
          <input type="hidden" name="id" value={event.id} />
          <button className="btn-ghost text-coral">
            <Trash2 className="size-4" /> {t("common.delete")}
          </button>
        </form>
      )}
    </div>
  );
}
