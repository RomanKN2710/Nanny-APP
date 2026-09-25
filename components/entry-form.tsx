"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { saveEntry } from "@/app/actions";
import { shiftHours, isHHMM } from "@/lib/dates";
import { fmtHours } from "@/lib/format";
import type { Entry, EntryType, Role } from "@/lib/types";
import { useLang, useT } from "./i18n";
import { Modal } from "./modal";

const TYPES: { type: EntryType; emoji: string; parentOnly?: boolean }[] = [
  { type: "work", emoji: "🧸" },
  { type: "vacation", emoji: "🌴" },
  { type: "sick", emoji: "🤒" },
  { type: "adjustment", emoji: "⚖️", parentOnly: true },
];

interface Props {
  role: Role;
  daily: number;
  today: string;
  entry?: Entry;
  onDone: () => void;
}

function EntryForm({ role, daily, today, entry, onDone }: Props) {
  const t = useT();
  const lang = useLang();
  const [state, action, pending] = useActionState(saveEntry, undefined);
  const [type, setType] = useState<EntryType>(entry?.type ?? "work");
  const [mode, setMode] = useState<"times" | "hours">(entry && entry.type === "work" && !entry.start ? "hours" : "times");
  const [start, setStart] = useState(entry?.start ?? "08:00");
  const [end, setEnd] = useState(entry?.end ?? "");
  const [brk, setBrk] = useState(String(entry?.breakMinutes ?? 0));
  const initialPortion = entry?.hours == null ? "full" : Math.abs(entry.hours - daily / 2) < 0.01 ? "half" : "custom";
  const [portion, setPortion] = useState<"full" | "half" | "custom">(initialPortion);
  const [hours, setHours] = useState(entry?.hours != null ? String(entry.hours) : "");

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  const total = isHHMM(start) && isHHMM(end) ? shiftHours(start, end, Number(brk) || 0) : null;

  return (
    <form action={action} className="flex flex-col gap-4">
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TYPES.filter((x) => !x.parentOnly || role === "parent").map((x) => (
          <button
            key={x.type}
            type="button"
            onClick={() => setType(x.type)}
            className={`flex flex-col items-center gap-0.5 rounded-2xl border-2 py-2.5 text-sm font-bold transition ${
              type === x.type ? "border-coral bg-coral-soft text-coral" : "border-line text-ink-soft hover:border-coral/30"
            }`}
          >
            <span className="text-xl">{x.emoji}</span>
            {t(`entry.type.${x.type}`)}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="date">{t("entry.date")}</label>
        <input id="date" name="date" type="date" required defaultValue={entry?.date ?? today} />
      </div>

      {type === "work" && (
        <>
          <input type="hidden" name="mode" value={mode} />
          <div className="flex gap-1 rounded-full bg-cream p-1 text-sm font-bold">
            {(["times", "hours"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 rounded-full py-1.5 transition ${mode === m ? "bg-white text-ink shadow" : "text-ink-soft"}`}>
                {t(`entry.mode.${m}`)}
              </button>
            ))}
          </div>
          {mode === "times" ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="field">
                <label htmlFor="start">{t("entry.start")}</label>
                <input id="start" name="start" type="time" required value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="end">{t("entry.end")}</label>
                <input id="end" name="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="breakMinutes">{t("entry.break")}</label>
                <input id="breakMinutes" name="breakMinutes" type="number" min={0} step={5} inputMode="numeric" value={brk} onChange={(e) => setBrk(e.target.value)} />
              </div>
              {total != null && (
                <p className="col-span-3 text-right text-sm font-bold text-mint">
                  {t("entry.total")}: {fmtHours(total, lang)} {t("common.h")}
                </p>
              )}
            </div>
          ) : (
            <div className="field">
              <label htmlFor="hours">{t("entry.hours")}</label>
              <input id="hours" name="hours" type="number" min={0.25} max={24} step={0.25} inputMode="decimal" required value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          )}
        </>
      )}

      {(type === "vacation" || type === "sick") && (
        <>
          <input type="hidden" name="portion" value={portion === "full" ? "full" : "custom"} />
          <div className="flex gap-1 rounded-full bg-cream p-1 text-sm font-bold">
            {(["full", "half", "custom"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPortion(p);
                  if (p === "half") setHours(String(Math.round((daily / 2) * 100) / 100));
                }}
                className={`flex-1 rounded-full py-1.5 transition ${portion === p ? "bg-white text-ink shadow" : "text-ink-soft"}`}
              >
                {t(p === "full" ? "entry.fullDay" : p === "half" ? "entry.halfDay" : "entry.custom")}
              </button>
            ))}
          </div>
          {portion === "full" ? (
            <p className="text-sm text-ink-soft">
              = {fmtHours(daily, lang)} {t("common.h")}
            </p>
          ) : (
            <div className="field">
              <label htmlFor="hours">{t("entry.hours")}</label>
              <input id="hours" name="hours" type="number" min={0.25} max={24} step={0.05} inputMode="decimal" required value={hours} onChange={(e) => setHours(e.target.value)} readOnly={portion === "half"} />
            </div>
          )}
        </>
      )}

      {type === "adjustment" && (
        <div className="field">
          <label htmlFor="hours">{t("entry.hours")}</label>
          <input id="hours" name="hours" type="number" step={0.05} inputMode="decimal" required value={hours} onChange={(e) => setHours(e.target.value)} />
          <p className="text-xs text-ink-soft">{t("entry.adjustHint")}</p>
        </div>
      )}

      <div className="field">
        <label htmlFor="note">{t("entry.note")}</label>
        <input id="note" name="note" placeholder={t("entry.notePh")} defaultValue={entry?.note ?? ""} maxLength={500} />
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
  );
}

export function AddEntryButton(props: Omit<Props, "onDone" | "entry"> & { compact?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="size-5" strokeWidth={3} /> {t("hours.add")}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("hours.add")}>
        <EntryForm {...props} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function EditEntryButton(props: Omit<Props, "onDone"> & { entry: Entry }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-ghost size-8 rounded-full p-0" onClick={() => setOpen(true)} title={t("common.edit")}>
        <Pencil className="size-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t("hours.edit")}>
        <EntryForm {...props} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
