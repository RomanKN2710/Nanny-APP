import { getContext } from "@/lib/context";
import { PageTitle } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const { role, t, settings } = await getContext();
  return (
    <>
      <PageTitle title={t("settings.title")} subtitle={role === "nanny" ? t("settings.parentsOnly") : undefined} />
      <SettingsForm settings={settings} canEdit={role === "parent"} />
    </>
  );
}
