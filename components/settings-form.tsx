"use client";

import { useActionState, useState } from "react";
import { Baby, CalendarOff, FileText, Languages } from "lucide-react";
import { saveSettings } from "@/app/actions";
import { HOLIDAYS } from "@/lib/holidays";
import { LANGS, LANG_LABEL } from "@/lib/i18n";
import { dailyTarget, hourlyRate } from "@/lib/balance";
import { fmtHours, fmtMoney, weekdayNames } from "@/lib/format";
import { CHILD_COLORS } from "@/lib/defaults";
import type { Settings } from "@/lib/types";
import { useLang, useT } from "./i18n";
import { CardTitle } from "./ui";

export function SettingsForm({ settings, canEdit }: { settings: Settings; canEdit: boolean }) {
  const t = useT();
  const lang = useLang();
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const [weekly, setWeekly] = useState(settings.weeklyHours);
  const [salary, setSalary] = useState(settings.monthlySalary);
  const [workDays, setWorkDays] = useState(settings.workDays);
  const wd = weekdayNames(lang, "short");
  const preview = { weeklyHours: weekly || 0, workDays, monthlySalary: salary || 0 };

  return (
    <form action={action}>
      <fieldset disabled={!canEdit || pending} className="grid gap-5 md:grid-cols-2">
        <section className="card md:col-span-2">
          <CardTitle icon={FileText} tone="coral">
            {t("settings.contract")}
          </CardTitle>
          <p className="mb-4 text-sm text-ink-soft">{t("settings.contractHint")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("settings.family")} name="familyName" defaultValue={settings.familyName} />
            <Field label={t("settings.nanny")} name="nannyName" defaultValue={settings.nannyName} />
            <Field label={t("settings.start")} name="startDate" type="date" defaultValue={settings.startDate} />
            <div className="field">
              <label htmlFor="weeklyHours">{t("settings.weekly")}</label>
              <input id="weeklyHours" name="weeklyHours" type="number" step={0.25} min={1} max={60} value={weekly} onChange={(e) => setWeekly(Number(e.target.value))} />
            </div>
            <Field label={t("settings.vacation")} name="vacationWeeks" type="number" step={0.5} min={0} max={10} defaultValue={settings.vacationWeeks} />
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <div className="field">
                <label htmlFor="monthlySalary">{t("settings.salary")}</label>
                <input id="monthlySalary" name="monthlySalary" type="number" step={5} min={0} value={salary} onChange={(e) => setSalary(Number(e.target.value))} />
              </div>
              <Field label={t("settings.currency")} name="currency" defaultValue={settings.currency} maxLength={3} />
            </div>
          </div>
          <div className="mt-4 field">
            <label>{t("settings.workdays")}</label>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <label key={d} className="grid h-10 min-w-12 cursor-pointer place-items-center rounded-xl border-2 border-line bg-white px-2 text-sm font-bold text-ink-soft capitalize has-[:checked]:border-coral has-[:checked]:bg-coral-soft has-[:checked]:text-coral">
                  <input
                    type="checkbox"
                    name="workDays"
                    value={d}
                    checked={workDays.includes(d)}
                    onChange={(e) => setWorkDays(e.target.checked ? [...workDays, d].sort() : workDays.filter((x) => x !== d))}
                    className="sr-only"
                  />
                  {wd[d]}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-2xl bg-mint-soft px-3 py-2 font-bold text-mint">
              {t("settings.daily")}: {fmtHours(dailyTarget({ ...settings, ...preview }), lang)} {t("common.h")}
            </span>
            <span className="rounded-2xl bg-sky-soft px-3 py-2 font-bold text-sky">
              {t("settings.rate")}: {fmtMoney(hourlyRate(preview), settings.currency, lang, 2)}
            </span>
          </div>
        </section>

        <section className="card">
          <CardTitle icon={CalendarOff} tone="lilac">
            {t("settings.holidays")}
          </CardTitle>
          <p className="mb-3 text-sm text-ink-soft">{t("settings.holidaysHint")}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {HOLIDAYS.map((h) => (
              <label key={h.id} className="flex items-center gap-2 font-semibold text-ink">
                <input type="checkbox" name="holidays" value={h.id} defaultChecked={settings.enabledHolidays.includes(h.id)} />
                {h.name[lang]}
              </label>
            ))}
          </div>
          <div className="mt-4 field">
            <label>{t("settings.custom")}</label>
            {settings.customHolidays.map((c) => (
              <label key={c.date} className="flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-1.5 text-sm text-ink">
                <span>
                  {c.date} · {c.name}
                </span>
                <span className="flex items-center gap-1 text-xs text-ink-soft">
                  <input type="checkbox" name="removeCustom" value={c.date} /> {t("settings.remove")}
                </span>
              </label>
            ))}
            <div className="grid grid-cols-[9.5rem_1fr] gap-2">
              <input name="customDate" type="date" aria-label={t("entry.date")} />
              <input name="customName" placeholder={t("settings.name")} maxLength={60} />
            </div>
          </div>
        </section>

        <section className="card">
          <CardTitle icon={Baby} tone="mint">
            {t("settings.children")}
          </CardTitle>
          <div className="flex flex-col gap-2">
            {settings.children.map((c) => (
              <div key={c.id} className="grid grid-cols-[3.5rem_1fr_3.5rem_auto] items-center gap-2">
                <input type="hidden" name="childId" value={c.id} />
                <input name="childEmoji" defaultValue={c.emoji} aria-label={t("settings.emoji")} className="text-center text-xl" maxLength={4} />
                <input name="childName" defaultValue={c.name} aria-label={t("settings.name")} maxLength={40} />
                <input name="childColor" type="color" defaultValue={c.color} aria-label={t("settings.color")} className="w-full" />
                <label className="flex items-center gap-1 text-xs" title={t("settings.remove")}>
                  <input type="checkbox" name="childRemove" value={c.id} /> ✕
                </label>
              </div>
            ))}
            <div className="mt-2 grid grid-cols-[3.5rem_1fr_3.5rem_auto] items-center gap-2 border-t border-line pt-3">
              <input name="newChildEmoji" placeholder="🙂" className="text-center text-xl" maxLength={4} aria-label={t("settings.emoji")} />
              <input name="newChildName" placeholder={t("settings.addChild")} maxLength={40} />
              <input name="newChildColor" type="color" defaultValue={CHILD_COLORS[settings.children.length % CHILD_COLORS.length]} className="w-full" aria-label={t("settings.color")} />
              <span className="w-5" />
            </div>
          </div>
        </section>

        <section className="card">
          <CardTitle icon={Languages} tone="sky">
            {t("settings.language")}
          </CardTitle>
          <select name="defaultLang" defaultValue={settings.defaultLang}>
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {LANG_LABEL[l]}
              </option>
            ))}
          </select>
        </section>

        {canEdit && (
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            {state?.ok && <span className="font-bold text-mint">✓ {t("common.saved")}</span>}
            {state?.error && <span className="font-bold text-coral">{t(state.error)}</span>}
            <button className="btn-primary px-8 py-3">{t("common.save")}</button>
          </div>
        )}
      </fieldset>
    </form>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} {...rest} />
    </div>
  );
}
