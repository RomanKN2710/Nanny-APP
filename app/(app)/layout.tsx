import { LogOut } from "lucide-react";
import { logout } from "@/app/actions";
import { getContext } from "@/lib/context";
import { I18nProvider } from "@/components/i18n";
import { BottomNav, SideNav } from "@/components/nav";
import { LangSwitch } from "@/components/lang-switch";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, lang, t, settings } = await getContext();
  const who = role === "nanny" ? settings.nannyName : t("role.parent");

  return (
    <I18nProvider lang={lang}>
      <div className="mx-auto flex min-h-dvh max-w-6xl gap-8 px-4 lg:px-8">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col py-8 lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <span className="grid size-11 place-items-center rounded-2xl bg-coral text-2xl shadow-[0_8px_20px_-8px_var(--color-coral)]">🏡</span>
            <div>
              <div className="text-xl leading-none font-black">{t("app.name")}</div>
              <div className="text-xs font-semibold text-ink-soft">{settings.familyName}</div>
            </div>
          </div>
          <SideNav />
          <div className="mt-auto flex flex-col gap-3 px-2">
            <LangSwitch />
            <form action={logout} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm">
              <span className="font-bold">
                {role === "nanny" ? "🧸" : "🏠"} {who}
              </span>
              <button className="btn-ghost px-2 py-1" title={t("nav.logout")}>
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-28 lg:py-8 lg:pb-12">
          <header className="flex items-center justify-between py-4 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-coral text-lg">🏡</span>
              <span className="text-lg font-black">{t("app.name")}</span>
            </div>
            <div className="flex items-center gap-2">
              <LangSwitch />
              <form action={logout}>
                <button className="btn-ghost size-9 rounded-full p-0" title={t("nav.logout")}>
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </header>
          {children}
        </div>
      </div>
      <BottomNav />
    </I18nProvider>
  );
}
