import { useTranslation } from "react-i18next";

import { AppShell } from "../components/AppShell";

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t("settings.title")}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-lg font-bold text-ink">{t("settings.title")}</h2>
        <p className="mt-2 text-sm text-ink-muted">{t("settings.privacyNote")}</p>
      </section>
    </AppShell>
  );
}
