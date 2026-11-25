import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { readPrefsWithMeta } from "../lib/prefs";

export function DishDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { prefs, hasStoredData } = readPrefsWithMeta();
    if (hasStoredData && !prefs.onboarded) {
      const currentPath = `${location.pathname}${location.search}`;
      navigate(`/settings?next=${encodeURIComponent(currentPath)}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <AppShell title={t("dish.description")}>
      <section className="rounded-md border border-line bg-surface p-4 shadow-card">
        <h2 className="text-2xl font-bold text-ink">{t("dish.description")}</h2>
        <p className="mt-1 text-sm text-ink-muted">{id}</p>
      </section>
    </AppShell>
  );
}
