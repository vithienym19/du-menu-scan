import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";

export function QrEntryPage() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();

  return (
    <AppShell title={t("common.appName")} showBack={false}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-lg font-bold text-ink">{t("entry.chooseCafeteria")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{code}</p>
      </section>
    </AppShell>
  );
}
