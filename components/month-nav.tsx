import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthNav({ base, month, label, prev, next, todayLabel, isCurrent }: { base: string; month: string; label: string; prev: string; next: string; todayLabel: string; isCurrent: boolean }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-[var(--shadow-soft)]">
      <Link href={`${base}?m=${prev}`} className="btn-ghost size-9 rounded-full p-0" aria-label="previous">
        <ChevronLeft className="size-5" />
      </Link>
      <span className="min-w-36 text-center font-extrabold" data-month={month}>
        {label}
      </span>
      <Link href={`${base}?m=${next}`} className="btn-ghost size-9 rounded-full p-0" aria-label="next">
        <ChevronRight className="size-5" />
      </Link>
      {!isCurrent && (
        <Link href={base} className="btn-ghost rounded-full px-3 py-1.5 text-sm">
          {todayLabel}
        </Link>
      )}
    </div>
  );
}

/** Reads ?m=YYYY-MM and returns the first day of that month (or of the current month). */
export function monthFromParam(m: string | string[] | undefined, today: string): string {
  return typeof m === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? `${m}-01` : today.slice(0, 7) + "-01";
}
