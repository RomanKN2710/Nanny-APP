import { Check, Download, Trash2 } from "lucide-react";
import { approveEntries, deleteEntry } from "@/app/actions";
import { getContext } from "@/lib/context";
import { listEntries } from "@/lib/repo";
import { dailyTarget, daysOverview, entryHours, isRunning } from "@/lib/balance";
import { addMonths, endOfMonth, todayISO } from "@/lib/dates";
import { fmtDate, fmtHours, fmtMonth } from "@/lib/format";
import type { Entry } from "@/lib/types";
import { PageTitle } from "@/components/ui";
import { AddEntryButton, EditEntryButton } from "@/components/entry-form";
import { MonthNav, monthFromParam } from "@/components/month-nav";
import { ConfirmSubmit } from "@/components/confirm-submit";

const TYPE_EMOJI: Record<Entry["type"], string> = { work: "🧸", vacation: "🌴", sick: "🤒", adjustment: "⚖️" };

export default async function HoursPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { role, lang, t, settings } = await getContext();
  const today = todayISO();
  const monthStart = monthFromParam((await searchParams).m, today);
  const monthEnd = endOfMonth(monthStart);
  const entries = await listEntries(monthStart, monthEnd);
  const daily = dailyTarget(settings);
  const h = t("common.h");

  const days = daysOverview(entries, settings, monthStart, monthEnd);
  const due = days.filter((d) => d.date <= today).reduce((s, d) => s + d.due, 0);
  const credited = days.filter((d) => d.date <= today).reduce((s, d) => s + d.credited, 0);
  const pending = entries.filter((e) => e.status === "pending" && !isRunning(e));
  const shownDays = days.filter((d) => entries.some((e) => e.date === d.date) || (d.holiday && d.due === 0 && d.date >= settings.startDate)).reverse();

  return (
    <>
      <PageTitle
        title={t("hours.title")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MonthNav
              base="/hours"
              month={monthStart}
              label={fmtMonth(monthStart, lang)}
              prev={addMonths(monthStart, -1).slice(0, 7)}
              next={addMonths(monthStart, 1).slice(0, 7)}
              todayLabel={t("common.today")}
              isCurrent={monthStart.slice(0, 7) === today.slice(0, 7)}
            />
            <AddEntryButton role={role} daily={daily} today={today} />
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Summary label={t("hours.due")} value={`${fmtHours(due, lang)} ${h}`} />
        <Summary label={t("hours.credited")} value={`${fmtHours(credited, lang)} ${h}`} />
        <Summary
          label={t("hours.diff")}
          value={`${fmtHours(credited - due, lang, true)} ${h}`}
          tone={credited - due > 0.005 ? "text-mint" : credited - due < -0.005 ? "text-coral" : ""}
        />
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        {role === "parent" && pending.length > 0 && (
          <form action={approveEntries}>
            <input type="hidden" name="ids" value={pending.map((e) => e.id).join(",")} />
            <button className="btn-soft bg-mint-soft text-mint hover:bg-mint/20">
              <Check className="size-4" strokeWidth={3} /> {t("hours.approveAll")} ({pending.length})
            </button>
          </form>
        )}
        <a href={`/hours/export?m=${monthStart.slice(0, 7)}`} className="btn-ghost">
          <Download className="size-4" /> {t("hours.export")}
        </a>
      </div>

      {shownDays.length === 0 ? (
        <div className="card py-12 text-center text-ink-soft">
          <div className="mb-2 text-4xl">🗓️</div>
          {t("hours.empty")}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shownDays.map((d) => {
            const dayEntries = entries.filter((e) => e.date === d.date);
            const delta = d.credited - d.due;
            return (
              <section key={d.date} className="card p-4">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <h2 className="font-extrabold">
                    {fmtDate(d.date, lang, { weekday: "long", day: "numeric", month: "long" })}
                    {d.holiday && <span className="chip ml-2 bg-lilac-soft text-lilac">🎉 {d.holiday}</span>}
                  </h2>
                  {dayEntries.length > 0 && (
                    <span className="text-sm font-bold text-ink-soft tabular-nums">
                      {fmtHours(d.credited, lang)} / {fmtHours(d.due, lang)} {h}
                      <span className={`ml-2 ${delta > 0.005 ? "text-mint" : delta < -0.005 ? "text-coral" : ""}`}>({fmtHours(delta, lang, true)})</span>
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {dayEntries.map((e) => {
                    const running = isRunning(e);
                    const canEdit = role === "parent" || e.status === "pending";
                    return (
                      <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2">
                        <span className="text-xl">{TYPE_EMOJI[e.type]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold">
                            {t(`entry.type.${e.type}`)}
                            {e.start && (
                              <span className="font-semibold text-ink-soft">
                                {" "}
                                · {e.start}–{e.end ?? "…"}
                                {e.breakMinutes > 0 && ` (−${e.breakMinutes}′)`}
                              </span>
                            )}
                          </div>
                          {e.note && <div className="truncate text-sm text-ink-soft">{e.note}</div>}
                        </div>
                        <span className="font-black tabular-nums">{running ? <span className="chip bg-mint-soft text-mint">{t("hours.running")}</span> : `${fmtHours(entryHours(e, settings), lang, e.type === "adjustment")} ${h}`}</span>
                        {!running && (
                          <span className={`chip ${e.status === "approved" ? "bg-mint-soft text-mint" : "bg-sun-soft text-[#9a7317]"}`}>
                            {e.status === "approved" ? "✓" : "…"}
                            <span className="hidden sm:inline">{t(e.status === "approved" ? "hours.approved" : "hours.pending")}</span>
                          </span>
                        )}
                        <div className="flex items-center">
                          {role === "parent" && e.status === "pending" && !running && (
                            <form action={approveEntries}>
                              <input type="hidden" name="ids" value={e.id} />
                              <button className="btn-ghost size-8 rounded-full p-0 text-mint" title={t("hours.approve")}>
                                <Check className="size-4" strokeWidth={3} />
                              </button>
                            </form>
                          )}
                          {canEdit && <EditEntryButton role={role} daily={daily} today={today} entry={e} />}
                          {canEdit && (
                            <form action={deleteEntry}>
                              <input type="hidden" name="id" value={e.id} />
                              <ConfirmSubmit message={t("hours.confirmDelete")} className="btn-ghost size-8 rounded-full p-0 hover:text-coral" title={t("common.delete")}>
                                <Trash2 className="size-4" />
                              </ConfirmSubmit>
                            </form>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Summary({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-bold text-ink-soft">{label}</div>
      <div className={`text-xl font-black tabular-nums sm:text-2xl ${tone}`}>{value}</div>
    </div>
  );
}
