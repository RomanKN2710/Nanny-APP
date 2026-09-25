import { redirect } from "next/navigation";
import { authConfigured, getRole } from "@/lib/auth";
import { getLang } from "@/lib/context";
import { translator } from "@/lib/i18n";
import { I18nProvider } from "@/components/i18n";
import { LoginForm } from "./login-form";
import { LangSwitch } from "@/components/lang-switch";

export default async function LoginPage() {
  if (await getRole()) redirect("/");
  const lang = await getLang();
  const t = translator(lang);

  return (
    <I18nProvider lang={lang}>
      <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
        <Blobs />
        <div className="absolute top-4 right-4">
          <LangSwitch />
        </div>
        <div className="relative w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid size-20 place-items-center rounded-[1.75rem] bg-coral text-4xl shadow-[0_12px_30px_-10px_var(--color-coral)]">
              🏡
            </div>
            <h1 className="text-3xl font-black">{t("login.title")}</h1>
            <p className="mt-1 text-ink-soft">{t("app.tagline")}</p>
          </div>
          {authConfigured() ? (
            <LoginForm />
          ) : (
            <div className="card text-center text-ink-soft">{t("login.notConfigured")}</div>
          )}
        </div>
      </main>
    </I18nProvider>
  );
}

function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 -left-20 size-72 rounded-full bg-sun-soft blur-2xl" />
      <div className="absolute top-1/3 -right-24 size-80 rounded-full bg-mint-soft blur-2xl" />
      <div className="absolute -bottom-24 left-1/4 size-72 rounded-full bg-sky-soft blur-2xl" />
    </div>
  );
}
