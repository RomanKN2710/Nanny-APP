"use client";

import { useActionState, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { login } from "@/app/actions";
import { useT } from "@/components/i18n";
import type { Role } from "@/lib/types";

export function LoginForm() {
  const t = useT();
  const [role, setRole] = useState<Role | null>(null);
  const [state, action, pending] = useActionState(login, undefined);

  if (!role) {
    return (
      <div className="card flex flex-col gap-3">
        <p className="text-center font-bold">{t("login.who")}</p>
        <button className="btn bg-sun-soft py-4 text-lg text-ink hover:bg-sun/30" onClick={() => setRole("nanny")}>
          <span className="text-2xl">🧸</span> {t("login.nanny")}
        </button>
        <button className="btn bg-sky-soft py-4 text-lg text-ink hover:bg-sky/20" onClick={() => setRole("parent")}>
          <span className="text-2xl">🏠</span> {t("login.parent")}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="card flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />
      <div className="field">
        <label htmlFor="pin">
          {role === "nanny" ? "🧸 " + t("login.nanny") : "🏠 " + t("login.parent")} · {t("login.pin")}
        </label>
        <input id="pin" name="pin" type="password" autoFocus autoComplete="current-password" inputMode="text" required className="text-center text-xl tracking-widest" />
      </div>
      {state?.error && <p className="text-center text-sm font-semibold text-coral">{t(state.error)}</p>}
      <button className="btn-primary py-3 text-lg" disabled={pending}>
        {t("login.submit")}
      </button>
      <button type="button" className="btn-ghost self-center text-sm" onClick={() => setRole(null)}>
        <ArrowLeft className="size-4" /> {t("login.back")}
      </button>
    </form>
  );
}
