import { useTranslation } from "react-i18next";

import { AppShell } from "../components/AppShell";
import { CafeteriaList } from "../components/CafeteriaList";

export function CafeteriaChooserPage() {
  const { t } = useTranslation();

  return (
    <AppShell title={t("common.appName")} showBack={false}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-lg font-bold text-ink">{t("entry.chooseCafeteria")}</h2>
        <div className="mt-3">
          <CafeteriaList />
        </div>
      </section>
    </AppShell>
  );
}
