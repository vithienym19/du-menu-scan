import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { useRequireOnboarding } from "../lib/prefs";

export function TodayMenuPage() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();

  useRequireOnboarding();

  return (
    <AppShell title={t("menu.title")}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-lg font-bold text-ink">{t("menu.title")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{code}</p>
      </section>
    </AppShell>
  );
}
