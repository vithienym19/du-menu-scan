import { useTranslation } from "react-i18next";

import { AppShell } from "../components/AppShell";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t("notFound.title")}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-xl font-bold text-ink">{t("notFound.title")}</h2>
        <p className="mt-2 text-base text-ink-muted">{t("notFound.body")}</p>
      </section>
    </AppShell>
  );
}
