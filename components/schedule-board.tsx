"use client";

import { useActionState, useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { deleteScheduleItem, saveScheduleItem } from "@/app/actions";
import { KIND_EMOJI } from "@/lib/categories";
import { weekdayNames } from "@/lib/format";
import type { Child, ScheduleItem, ScheduleKind } from "@/lib/types";
import { useLang, useT } from "./i18n";
import { Modal } from "./modal";

const KINDS: ScheduleKind[] = ["school", "activity", "care", "other"];

export function ScheduleBoard({ items, kids, todayWeekday }: { items: ScheduleItem[]; kids: Child[]; todayWeekday: number }) {
  const t = useT();
  const lang = useLang();
  const [filter, setFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ item?: ScheduleItem; weekday?: number } | null>(null);
  const wd = weekdayNames(lang, "long");
  const kid = new Map(kids.map((k) => [k.id, k]));

  const visible = items.filter((i) => !filter || i.childId === filter);
  const weekend = items.some((i) => i.weekday > 5);
  const days = weekend ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter(null)} className={`chip border-2 py-1.5 text-sm ${!filter ? "border-coral bg-coral-soft text-coral" : "border-line bg-white text-ink-soft"}`}>
            👨‍👩‍👧‍👦 {t("schedule.all")}
          </button>
          {kids.map((k) => (
            <button
              key={k.id}
              onClick={() => setFilter(k.id)}
              className={`chip border-2 py-1.5 text-sm ${filter === k.id ? "text-ink" : "border-line bg-white text-ink-soft"}`}
              style={filter === k.id ? { borderColor: k.color, background: `${k.color}26` } : undefined}
            >
              {k.emoji} {k.name}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setEditing({})} disabled={!kids.length}>
          <Plus className="size-5" strokeWidth={3} /> {t("schedule.add")}
        </button>
      </div>

      {items.length === 0 && <div className="card mb-4 py-10 text-center text-ink-soft">📚 {t("schedule.empty")}</div>}

      <div className={`grid gap-3 ${weekend ? "lg:grid-cols-7" : "md:grid-cols-5"}`}>
        {days.map((d) => {
          const dayItems = visible.filter((i) => i.weekday === d);
          return (
            <section key={d} className={`card flex flex-col gap-2 p-3 ${d === todayWeekday ? "ring-2 ring-coral/40" : ""}`}>
              <div className="flex items-center justify-between px-1">
                <h2 className="font-extrabold capitalize">{wd[d]}</h2>
                <button className="btn-ghost size-7 rounded-full p-0" onClick={() => setEditing({ weekday: d })} aria-label={t("schedule.add")}>
                  <Plus className="size-4" />
                </button>
              </div>
              {dayItems.map((i) => {
                const k = kid.get(i.childId);
                return (
                  <button
                    key={i.id}
                    onClick={() => setEditing({ item: i })}
                    className="rounded-2xl border-l-4 px-3 py-2 text-left transition hover:brightness-95"
                    style={{ borderColor: k?.color ?? "#ccc", background: `${k?.color ?? "#ccc"}1f` }}
                  >
                    <div className="text-xs font-extrabold text-ink-soft tabular-nums">
                      {i.start}–{i.end}
                    </div>
                    <div className="font-bold">
                      {KIND_EMOJI[i.kind]} {i.title}
                    </div>
                    <div className="text-xs text-ink-soft">
                      {k?.emoji} {k?.name}
                    </div>
                    {i.location && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                        <MapPin className="size-3" /> {i.location}
                      </div>
                    )}
                    {i.note && <div className="mt-1 rounded-lg bg-white/70 px-2 py-1 text-xs">{i.note}</div>}
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.item ? t("schedule.edit") : t("schedule.add")}>
        {editing && <ScheduleForm item={editing.item} weekday={editing.weekday} kids={kids} defaultChild={filter} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

function ScheduleForm({ item, weekday, kids, defaultChild, onDone }: { item?: ScheduleItem; weekday?: number; kids: Child[]; defaultChild: string | null; onDone: () => void }) {
  const t = useT();
  const lang = useLang();
  const [state, action, pending] = useActionState(saveScheduleItem, undefined);
  const wd = weekdayNames(lang, "short");
  const selectedDays = item ? [item.weekday] : weekday ? [weekday] : [];

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        {item && <input type="hidden" name="id" value={item.id} />}
        <div className="field">
          <label>{t("schedule.child")}</label>
          <div className="flex flex-wrap gap-2">
            {kids.map((k, idx) => (
              <label key={k.id} className="chip cursor-pointer border-2 border-line bg-white py-1.5 text-sm text-ink has-[:checked]:bg-cream" style={{ borderColor: undefined }}>
                <input type="radio" name="childId" value={k.id} required defaultChecked={item ? item.childId === k.id : defaultChild ? defaultChild === k.id : idx === 0} className="accent-coral" />
                {k.emoji} {k.name}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="title">{t("schedule.what")}</label>
          <input id="title" name="title" required maxLength={120} defaultValue={item?.title} placeholder="École / Judo / Piano…" />
        </div>
        <div className="field">
          <label>{t("schedule.kind")}</label>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <label key={k} className="chip cursor-pointer border-2 border-line bg-white py-1.5 text-sm text-ink has-[:checked]:border-coral has-[:checked]:bg-coral-soft">
                <input type="radio" name="kind" value={k} defaultChecked={(item?.kind ?? "school") === k} className="sr-only" />
                {KIND_EMOJI[k]} {t(`kind.${k}`)}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t("schedule.days")}</label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <label key={d} className="grid h-10 min-w-12 cursor-pointer place-items-center rounded-xl border-2 border-line bg-white px-2 text-sm font-bold text-ink-soft capitalize has-[:checked]:border-coral has-[:checked]:bg-coral-soft has-[:checked]:text-coral">
                <input type={item ? "radio" : "checkbox"} name="weekday" value={d} defaultChecked={selectedDays.includes(d)} className="sr-only" />
                {wd[d]}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="field">
            <label htmlFor="start">{t("entry.start")}</label>
            <input id="start" name="start" type="time" required defaultValue={item?.start ?? "08:00"} />
          </div>
          <div className="field">
            <label htmlFor="end">{t("entry.end")}</label>
            <input id="end" name="end" type="time" required defaultValue={item?.end ?? "11:45"} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="location">{t("schedule.location")}</label>
          <input id="location" name="location" maxLength={200} defaultValue={item?.location} />
        </div>
        <div className="field">
          <label htmlFor="note">{t("event.note")}</label>
          <input id="note" name="note" maxLength={500} defaultValue={item?.note} placeholder={t("schedule.note")} />
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
      {item && (
        <form
          action={async (fd) => {
            await deleteScheduleItem(fd);
            onDone();
          }}
          className="border-t border-line pt-3"
        >
          <input type="hidden" name="id" value={item.id} />
          <button className="btn-ghost text-coral">
            <Trash2 className="size-4" /> {t("common.delete")}
          </button>
        </form>
      )}
    </div>
  );
}
