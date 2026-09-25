import type { LucideIcon } from "lucide-react";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardTitle({ icon: Icon, tone = "coral", children, right }: { icon: LucideIcon; tone?: Tone; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2.5 font-extrabold">
        <span className={`grid size-8 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-4.5" strokeWidth={2.5} />
        </span>
        {children}
      </h2>
      {right}
    </div>
  );
}

export type Tone = "coral" | "mint" | "sun" | "sky" | "lilac" | "rose";
export const TONES: Record<Tone, string> = {
  coral: "bg-coral-soft text-coral",
  mint: "bg-mint-soft text-mint",
  sun: "bg-sun-soft text-[#b88a1c]",
  sky: "bg-sky-soft text-sky",
  lilac: "bg-lilac-soft text-lilac",
  rose: "bg-rose-soft text-rose",
};

export function Progress({ value, max, marker, tone = "mint" }: { value: number; max: number; marker?: number; tone?: "mint" | "coral" | "sky" }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, max > 0 ? (v / max) * 100 : 0))}%`;
  const bar = { mint: "bg-mint", coral: "bg-coral", sky: "bg-sky" }[tone];
  return (
    <div className="relative h-3.5 rounded-full bg-cream">
      <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: pct(value) }} />
      {marker != null && <div className="absolute -top-1 -bottom-1 w-1 rounded-full bg-ink/70" style={{ left: `calc(${pct(marker)} - 2px)` }} />}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-cream px-3 py-2.5">
      <div className="text-xs font-bold text-ink-soft">{label}</div>
      <div className="text-lg font-black">{value}</div>
      {sub && <div className="text-xs text-ink-soft">{sub}</div>}
    </div>
  );
}
