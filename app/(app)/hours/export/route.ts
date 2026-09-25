import { getRole } from "@/lib/auth";
import { entryHours } from "@/lib/balance";
import { endOfMonth, todayISO } from "@/lib/dates";
import { getSettings, listEntries } from "@/lib/repo";

// CSV of one month's entries, e.g. for payroll or your own records.
export async function GET(req: Request) {
  if (!(await getRole())) return new Response("Unauthorized", { status: 401 });
  const m = new URL(req.url).searchParams.get("m");
  const monthStart = m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m) ? `${m}-01` : todayISO().slice(0, 7) + "-01";
  const [settings, entries] = await Promise.all([getSettings(), listEntries(monthStart, endOfMonth(monthStart))]);

  const esc = (v: string) => (/[";\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const lines = [["date", "type", "start", "end", "break_min", "hours", "status", "note"].join(";")];
  for (const e of entries) {
    lines.push(
      [e.date, e.type, e.start ?? "", e.end ?? "", String(e.breakMinutes), entryHours(e, settings).toFixed(2), e.status, esc(e.note)].join(";"),
    );
  }
  const total = entries.reduce((s, e) => s + entryHours(e, settings), 0);
  lines.push(["total", "", "", "", "", total.toFixed(2), "", ""].join(";"));

  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hours-${monthStart.slice(0, 7)}.csv"`,
    },
  });
}
