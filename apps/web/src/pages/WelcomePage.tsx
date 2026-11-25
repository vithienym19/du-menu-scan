import { useTranslation } from "react-i18next";

import { AppShell } from "../components/AppShell";

export function WelcomePage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t("common.appName")} showBack={false}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-xl font-bold text-ink">{t("welcome.title")}</h2>
        <p className="mt-2 text-base text-ink-muted">{t("welcome.subtitle")}</p>
      </section>
    </AppShell>
  );
}
