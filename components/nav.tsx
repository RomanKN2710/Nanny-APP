"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Clock3, Home, School, Settings } from "lucide-react";
import { useT } from "./i18n";
import type { Key } from "@/lib/i18n";

const ITEMS: { href: string; label: Key; short?: Key; icon: typeof Home }[] = [
  { href: "/", label: "nav.home", icon: Home },
  { href: "/hours", label: "nav.hours", icon: Clock3 },
  { href: "/calendar", label: "nav.calendar", icon: CalendarHeart },
  { href: "/schedule", label: "nav.schedule", short: "nav.scheduleShort", icon: School },
  { href: "/settings", label: "nav.settings", icon: Settings },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

export function SideNav() {
  const t = useT();
  const isActive = useActive();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition ${
            isActive(href) ? "bg-white text-coral shadow-[var(--shadow-soft)]" : "text-ink-soft hover:bg-white/60 hover:text-ink"
          }`}
        >
          <Icon className="size-5" strokeWidth={2.4} />
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNav() {
  const t = useT();
  const isActive = useActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map(({ href, label, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${active ? "text-coral" : "text-ink-soft"}`}>
              <span className={`grid h-8 w-12 place-items-center rounded-full transition ${active ? "bg-coral-soft" : ""}`}>
                <Icon className="size-5" strokeWidth={2.4} />
              </span>
              {t(short ?? label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
