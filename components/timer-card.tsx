"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Square, Timer } from "lucide-react";
import { startShift, stopShift } from "@/app/actions";
import { useLang, useT } from "./i18n";
import { fmtHours } from "@/lib/format";
import { CardTitle } from "./ui";

function elapsed(date: string, start: string, now: Date): string {
  const [h, m] = start.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  // start is local Zurich time; approximate using the browser's clock, which is fine for display
  const began = new Date(y, mo - 1, d, h, m);
  const mins = Math.max(0, Math.floor((now.getTime() - began.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}`;
}

export function TimerCard({ running, loggedToday }: { running: { date: string; start: string } | null; loggedToday: number }) {
  const t = useT();
  const lang = useLang();
  const [now, setNow] = useState(() => new Date());
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <section className={`card ${running ? "bg-gradient-to-br from-mint-soft to-white" : ""}`}>
      <CardTitle icon={Timer} tone="mint">
        {t("timer.title")}
      </CardTitle>
      {running ? (
        <form action={stopShift} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-mint">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-mint" />
              </span>
              {t("timer.running", { time: running.start })}
            </div>
            <div className="mt-1 text-4xl font-black tabular-nums" suppressHydrationWarning>
              {elapsed(running.date, running.start, now)}
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="field w-24">
              <label htmlFor="breakMinutes">{t("timer.break")}</label>
              <input id="breakMinutes" name="breakMinutes" type="number" min={0} max={600} step={5} defaultValue={0} inputMode="numeric" />
            </div>
            <button className="btn-primary h-[46px]">
              <Square className="size-4 fill-current" /> {t("timer.stop")}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-ink-soft">
            {loggedToday > 0 ? t("timer.loggedToday", { hours: fmtHours(loggedToday, lang) }) : t("timer.idle")}
          </div>
          <button className="btn-primary bg-mint py-3 shadow-[0_6px_16px_-6px_var(--color-mint)]" disabled={pending} onClick={() => startTransition(() => void startShift())}>
            <Play className="size-4 fill-current" /> {t("timer.start")}
          </button>
        </div>
      )}
    </section>
  );
}
