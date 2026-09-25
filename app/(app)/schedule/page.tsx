import Link from "next/link";
import { Backpack } from "lucide-react";
import { getContext } from "@/lib/context";
import { listEvents, listSchedule } from "@/lib/repo";
import { addMonths, isoWeekday, todayISO } from "@/lib/dates";
import { fmtDate } from "@/lib/format";
import { CardTitle, PageTitle } from "@/components/ui";
import { ScheduleBoard } from "@/components/schedule-board";

export default async function SchedulePage() {
  const { lang, t, settings } = await getContext();
  const today = todayISO();
  const [items, events] = await Promise.all([listSchedule(), listEvents(today, addMonths(today, 12))]);
  const schoolHolidays = events.filter((e) => e.category === "school_holiday" && e.endDate >= today).slice(0, 6);

  return (
    <>
      <PageTitle title={t("schedule.title")} />
      <ScheduleBoard items={items} kids={settings.children} todayWeekday={isoWeekday(today)} />

      <section className="card mt-6">
        <CardTitle icon={Backpack} tone="sun">
          {t("schedule.holidays")}
        </CardTitle>
        {schoolHolidays.length === 0 ? (
          <p className="text-ink-soft">{t("schedule.noHolidays")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {schoolHolidays.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-2xl bg-sun-soft px-3 py-2">
                <span className="font-bold">🎒 {e.title}</span>
                <span className="text-sm font-semibold text-ink-soft">
                  {fmtDate(e.startDate, lang)} – {fmtDate(e.endDate, lang, { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-ink-soft">
          <Link href="/calendar" className="font-bold text-coral">
            {t("nav.calendar")} →
          </Link>{" "}
          {t("schedule.holidaysHint")}
        </p>
      </section>
    </>
  );
}
