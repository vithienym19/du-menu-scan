import { DEFAULT_LANGUAGE, isLanguage, type Language } from "@du-menu-scan/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { CafeteriaList } from "../components/CafeteriaList";
import { api } from "../lib/api";
import { readPrefsWithMeta } from "../lib/prefs";

export function QrEntryPage() {
  const { t, i18n } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const loggedCodeRef = useRef<string | null>(null);

  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const trimmedCode = code?.trim() ?? "";

  const cafeteriaQuery = useQuery({
    queryKey: ["cafeteria", trimmedCode],
    queryFn: () => api.getCafeteria(trimmedCode),
    enabled: Boolean(trimmedCode),
  });

  const isInvalidCode =
    !trimmedCode ||
    (!cafeteriaQuery.isPending && !cafeteriaQuery.isError && cafeteriaQuery.data === null);

  useEffect(() => {
    const cafeteria = cafeteriaQuery.data;
    if (!cafeteria) return;

    if (loggedCodeRef.current !== cafeteria.code) {
      loggedCodeRef.current = cafeteria.code;
      void api
        .logScan({
          cafeteriaCode: cafeteria.code,
          lang: currentLang,
          entry: "qr",
        })
        .catch(() => {});
    }

    const { prefs, hasStoredData } = readPrefsWithMeta();
    const todayPath = `/r/${encodeURIComponent(cafeteria.code)}/today`;
    const target = prefs.onboarded
      ? todayPath
      : hasStoredData
        ? `/settings?next=${encodeURIComponent(todayPath)}`
        : `/welcome?next=${encodeURIComponent(todayPath)}`;
    navigate(target, { replace: true });
  }, [cafeteriaQuery.data, currentLang, navigate]);

  if (trimmedCode && cafeteriaQuery.isError) {
    return (
      <AppShell title={t("common.appName")} showBack={false}>
        <section role="alert" className="rounded-md border border-line bg-surface p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">{t("entry.errorTitle")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("entry.errorBody")}</p>
          <button
            type="button"
            onClick={() => void cafeteriaQuery.refetch()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-surface hover:bg-brand-strong"
          >
            {t("common.retry")}
          </button>
        </section>
      </AppShell>
    );
  }

  if (isInvalidCode) {
    return (
      <AppShell title={t("common.appName")} showBack={false}>
        <section className="rounded-md border border-line bg-surface p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">{t("entry.invalidTitle")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("entry.invalidBody")}</p>

          <h3 className="mt-5 text-sm font-semibold text-ink">{t("entry.chooseCafeteria")}</h3>

          <div className="mt-3">
            <CafeteriaList />
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell title={t("common.appName")} showBack={false}>
      <section
        role="status"
        aria-live="polite"
        className="rounded-md border border-line bg-surface p-4 shadow-card"
      >
        <p className="text-base text-ink-muted">{t("common.loading")}</p>
      </section>
    </AppShell>
  );
}
