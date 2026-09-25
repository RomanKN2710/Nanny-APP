import { getContext } from "@/lib/context";
import { listEvents } from "@/lib/repo";
import { occurrencesInRange } from "@/lib/calendar";
import { addDays, addMonths, eachDay, endOfMonth, startOfWeek, todayISO, yearOf } from "@/lib/dates";
import { fmtMonth } from "@/lib/format";
import { holidaysForYear } from "@/lib/holidays";
import { PageTitle } from "@/components/ui";
import { MonthNav, monthFromParam } from "@/components/month-nav";
import { CalendarBoard, type CalendarDay } from "@/components/calendar-board";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { lang, t, settings } = await getContext();
  const today = todayISO();
  const monthStart = monthFromParam((await searchParams).m, today);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(startOfWeek(monthEnd), 6);

  const events = await listEvents(gridStart, gridEnd);
  const occ = occurrencesInRange(events, gridStart, gridEnd);
  const holidays = new Map<string, string>();
  for (const y of new Set([yearOf(gridStart), yearOf(gridEnd)])) {
    for (const [d, name] of holidaysForYear(y, settings.enabledHolidays, settings.customHolidays, lang)) holidays.set(d, name);
  }

  const days: CalendarDay[] = [...eachDay(gridStart, gridEnd)].map((date) => ({
    date,
    inMonth: date >= monthStart && date <= monthEnd,
    holiday: holidays.get(date),
    eventIds: occ.filter((o) => o.date === date).map((o) => o.event.id),
  }));

  return (
    <>
      <PageTitle
        title={t("calendar.title")}
        action={
          <MonthNav
            base="/calendar"
            month={monthStart}
            label={fmtMonth(monthStart, lang)}
            prev={addMonths(monthStart, -1).slice(0, 7)}
            next={addMonths(monthStart, 1).slice(0, 7)}
            todayLabel={t("common.today")}
            isCurrent={monthStart.slice(0, 7) === today.slice(0, 7)}
          />
        }
      />
      <CalendarBoard days={days} events={events} kids={settings.children} today={today} />
    </>
  );
}
