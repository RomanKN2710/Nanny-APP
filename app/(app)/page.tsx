import Link from "next/link";
import { AlertTriangle, CalendarDays, CalendarHeart, HelpCircle, Palmtree, PiggyBank, School, Target } from "lucide-react";
import { getContext } from "@/lib/context";
import { listEntries, listEvents, listSchedule } from "@/lib/repo";
import { computeAccount, dailyTarget, daysOverview, entryHours, hourlyRate, isRunning, yearSummary } from "@/lib/balance";
import { occurrencesInRange } from "@/lib/calendar";
import { addDays, isoWeekday, startOfWeek, todayISO, yearOf } from "@/lib/dates";
import { fmtDate, fmtHours, fmtMoney, weekdayNames } from "@/lib/format";
import { holidaysForYear } from "@/lib/holidays";
import { CardTitle, PageTitle, Progress, Stat } from "@/components/ui";
import { TimerCard } from "@/components/timer-card";
import { AddEntryButton } from "@/components/entry-form";
import { EventChip } from "@/components/event-chip";

export default async function Dashboard() {
  const { role, lang, t, settings } = await getContext();
  const today = todayISO();
  const refDay = today < settings.startDate ? settings.startDate : today;
  const year = yearOf(refDay);

  const [entries, events, schedule] = await Promise.all([listEntries(), listEvents(today, addDays(today, 7)), listSchedule()]);

  const account = computeAccount(entries, settings, today);
  const ys = yearSummary(entries, settings, year, today);
  const daily = dailyTarget(settings);
  const rate = hourlyRate(settings);
  const weekStart = startOfWeek(today);
  const week = daysOverview(entries, settings, weekStart, addDays(weekStart, 6));
  const wdNames = weekdayNames(lang, "short");

  const running = entries.find(isRunning) ?? null;
  const loggedToday = entries.filter((e) => e.date === today).reduce((s, e) => s + entryHours(e, settings), 0);

  const occ = occurrencesInRange(events, today, addDays(today, 7));
  const holidayMap = new Map([...holidaysForYear(yearOf(today), settings.enabledHolidays, settings.customHolidays, lang), ...holidaysForYear(yearOf(today) + 1, settings.enabledHolidays, settings.customHolidays, lang)]);
  const upcomingDays = Array.from({ length: 8 }, (_, i) => addDays(today, i))
    .map((d) => ({ date: d, items: occ.filter((o) => o.date === d), holiday: holidayMap.get(d) }))
    .filter((d) => d.items.length || d.holiday);

  const todaysSchedule = schedule.filter((s) => s.weekday === isoWeekday(today));
  const childById = new Map(settings.children.map((c) => [c.id, c]));

  const balanceTone = account.balance > 0.005 ? "text-mint" : account.balance < -0.005 ? "text-coral" : "text-ink";
  const greeting = role === "nanny" ? t("home.hello", { name: settings.nannyName }) : t("home.helloFamily", { name: settings.familyName });
  const h = t("common.h");

  return (
    <>
      <PageTitle
        title={`${greeting} 👋`}
        subtitle={fmtDate(today, lang, { weekday: "long", day: "numeric", month: "long" })}
        action={<AddEntryButton role={role} daily={daily} today={today} />}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <TimerCard running={running && running.start ? { date: running.date, start: running.start } : null} loggedToday={loggedToday} />
        </div>

        {/* Balance */}
        <section className="card">
          <CardTitle icon={PiggyBank} tone="coral">
            {t("balance.title")}
          </CardTitle>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black tabular-nums ${balanceTone}`}>{fmtHours(account.balance, lang, true)}</span>
            <span className="font-bold text-ink-soft">
              {h} · {account.balance > 0.005 ? t("balance.plus") : account.balance < -0.005 ? t("balance.minus") : t("balance.even")}
            </span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {t("balance.detail", { credited: fmtHours(account.credited, lang), due: fmtHours(account.due, lang), start: fmtDate(settings.startDate, lang, { day: "numeric", month: "long" }) })}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {account.overdue12m > 0 ? (
              <Notice tone="coral">{t("balance.overdue12m", { hours: fmtHours(account.overdue12m, lang), amount: fmtMoney(account.overdue12m * rate, settings.currency, lang) })}</Notice>
            ) : account.overdue3m > 0 ? (
              <Notice tone="sun">{t("balance.overdue3m", { hours: fmtHours(account.overdue3m, lang) })}</Notice>
            ) : null}
            {account.pendingCount > 0 && (
              <Link href="/hours" className="flex items-center justify-between rounded-2xl bg-sky-soft px-3 py-2 text-sm font-bold text-sky">
                {t("balance.pending", { count: account.pendingCount })}
                <span>{t("balance.review")} →</span>
              </Link>
            )}
          </div>
        </section>

        {/* Year budget */}
        <section className="card">
          <CardTitle icon={Target} tone="mint">
            {t("year.title", { year })}
          </CardTitle>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-3xl font-black tabular-nums">
              {fmtHours(ys.workedHours + ys.sickHours + ys.adjustmentHours, lang)}
              <span className="text-lg text-ink-soft">
                {" "}/ {fmtHours(ys.budgetHours, lang)} {h}
              </span>
            </span>
          </div>
          <Progress value={ys.workedHours + ys.sickHours + ys.adjustmentHours} max={ys.budgetHours} marker={ys.expectedToDate} />
          <div className="mt-2 flex justify-between text-xs font-semibold text-ink-soft">
            <span>
              ▮ {t("year.expected")}: {fmtHours(ys.expectedToDate, lang)} {h}
            </span>
            <span>
              {t("year.remaining")}: {fmtHours(ys.remainingHours, lang)} {h}
            </span>
          </div>
          <p className="mt-3 rounded-2xl bg-cream px-3 py-2 text-xs text-ink-soft">
            {t("year.explain", { workdays: ys.workdays, daily: fmtHours(daily, lang), vacation: fmtHours(ys.vacationDaysEntitled, lang), budget: fmtHours(ys.budgetHours, lang) })}
            {ys.sickHours > 0 && <> · {t("year.sick", { hours: fmtHours(ys.sickHours, lang) })}</>}
          </p>
        </section>

        {/* This week */}
        <section className="card">
          <CardTitle icon={CalendarDays} tone="sky">
            {t("week.title")}
          </CardTitle>
          <div className="grid grid-cols-7 items-end gap-1.5">
            {week.map((d) => {
              const max = Math.max(daily * 1.6, ...week.map((w) => w.credited));
              const isToday = d.date === today;
              return (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  <span className="text-[11px] font-bold text-ink-soft tabular-nums">{d.credited ? fmtHours(d.credited, lang) : ""}</span>
                  <div className="relative flex h-24 w-full items-end overflow-hidden rounded-xl bg-cream">
                    {d.due > 0 && <div className="absolute inset-x-0 border-t-2 border-dashed border-ink/25" style={{ bottom: `${(d.due / max) * 100}%` }} />}
                    <div className={`w-full rounded-xl ${d.credited >= d.due ? "bg-mint" : "bg-sky"}`} style={{ height: `${(d.credited / max) * 100}%` }} />
                  </div>
                  <span className={`text-xs font-bold ${isToday ? "rounded-full bg-coral px-1.5 text-white" : d.holiday ? "text-lilac" : "text-ink-soft"}`}>{wdNames[isoWeekday(d.date)]}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            <b className="text-ink">{fmtHours(week.reduce((s, d) => s + d.credited, 0), lang)}</b> {h} {t("week.done")} ·{" "}
            <b className="text-ink">{fmtHours(week.reduce((s, d) => s + d.due, 0), lang)}</b> {h} {t("week.due")}
          </p>
        </section>

        {/* Vacation */}
        <section className="card">
          <CardTitle icon={Palmtree} tone="sun">
            {t("vac.title", { year })}
          </CardTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t("vac.entitled")} value={fmtHours(ys.vacationDaysEntitled, lang)} sub={t("vac.days")} />
            <Stat label={t("vac.taken")} value={fmtHours(ys.vacationDaysTaken, lang)} sub={t("vac.days")} />
            <Stat label={t("vac.planned")} value={fmtHours(ys.vacationDaysPlanned, lang)} sub={t("vac.days")} />
            <Stat label={t("vac.left")} value={<span className="text-mint">{fmtHours(ys.vacationDaysLeft, lang)}</span>} sub={t("vac.days")} />
          </div>
          <div className="mt-3">
            <Progress value={ys.vacationDaysTaken + ys.vacationDaysPlanned} max={ys.vacationDaysEntitled} tone="sky" />
          </div>
        </section>

        {/* Coming up */}
        <section className="card">
          <CardTitle icon={CalendarHeart} tone="rose" right={<Link href="/calendar" className="text-sm font-bold text-coral">→</Link>}>
            {t("upcoming.title")}
          </CardTitle>
          {upcomingDays.length === 0 ? (
            <p className="text-ink-soft">{t("upcoming.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {upcomingDays.map((d) => (
                <li key={d.date}>
                  <div className="mb-1 text-xs font-extrabold tracking-wide text-ink-soft uppercase">
                    {d.date === today ? t("upcoming.today") : d.date === addDays(today, 1) ? t("upcoming.tomorrow") : fmtDate(d.date, lang, { weekday: "long", day: "numeric", month: "short" })}
                  </div>
                  <div className="flex flex-col gap-1">
                    {d.holiday && <div className="chip bg-lilac-soft text-lilac">🎉 {d.holiday}</div>}
                    {d.items.map((o) => (
                      <EventChip key={o.event.id + o.date} event={o.event} kids={settings.children} label={t(`cat.${o.event.category}`)} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's school & activities */}
        <section className="card">
          <CardTitle icon={School} tone="lilac" right={<Link href="/schedule" className="text-sm font-bold text-coral">→</Link>}>
            {t("todaySchedule.title")}
          </CardTitle>
          {todaysSchedule.length === 0 ? (
            <p className="text-ink-soft">{t("todaySchedule.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {todaysSchedule.map((s) => {
                const child = childById.get(s.childId);
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-2xl px-3 py-2" style={{ background: `${child?.color ?? "#ccc"}22` }}>
                    <span className="text-xl">{child?.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{s.title}</div>
                      <div className="truncate text-xs text-ink-soft">
                        {child?.name}
                        {s.location && ` · ${s.location}`}
                        {s.note && ` · ${s.note}`}
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums">
                      {s.start}–{s.end}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* How it works */}
        <details className="card md:col-span-2">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 font-extrabold">
            <span className="grid size-8 place-items-center rounded-xl bg-sky-soft text-sky">
              <HelpCircle className="size-4.5" strokeWidth={2.5} />
            </span>
            {t("how.title")}
          </summary>
          <div className="mt-4 grid gap-3 text-sm leading-relaxed text-ink-soft sm:grid-cols-2">
            {(["how.p1", "how.p2", "how.p3", "how.p4"] as const).map((k) => (
              <p key={k} className="rounded-2xl bg-cream p-3">
                {t(k, { daily: fmtHours(daily, lang), rate: fmtMoney(rate, settings.currency, lang, 2) + "/h" })}
              </p>
            ))}
          </div>
        </details>
      </div>
    </>
  );
}

function Notice({ tone, children }: { tone: "sun" | "coral"; children: React.ReactNode }) {
  return (
    <div className={`flex gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${tone === "sun" ? "bg-sun-soft text-[#8a6613]" : "bg-coral-soft text-coral"}`}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
