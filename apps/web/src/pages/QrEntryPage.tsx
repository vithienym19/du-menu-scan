import { DEFAULT_LANGUAGE, isLanguage, localize, type Language } from "@du-menu-scan/shared";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { api } from "../lib/api";
import { readPrefs } from "../lib/prefs";

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

  const cafeteriasQuery = useQuery({
    queryKey: ["cafeterias"],
    queryFn: () => api.listCafeterias(),
    enabled: isInvalidCode,
  });

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

    const prefs = readPrefs();
    const todayPath = `/r/${encodeURIComponent(cafeteria.code)}/today`;
    const target = prefs.onboarded ? todayPath : `/welcome?next=${encodeURIComponent(todayPath)}`;
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

          {cafeteriasQuery.isPending ? (
            <p role="status" className="mt-3 text-sm text-ink-muted">
              {t("common.loading")}
            </p>
          ) : cafeteriasQuery.isError ? (
            <div role="alert" className="mt-3">
              <p className="text-sm font-medium text-ink">{t("entry.errorTitle")}</p>
              <p className="mt-1 text-sm text-ink-muted">{t("entry.errorBody")}</p>
              <button
                type="button"
                onClick={() => void cafeteriasQuery.refetch()}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-surface hover:bg-brand-strong"
              >
                {t("common.retry")}
              </button>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {cafeteriasQuery.data.map((cafeteria) => {
                const localized = localize(cafeteria.name, currentLang);
                return (
                  <li key={cafeteria.id}>
                    <Link
                      to={`/r/${encodeURIComponent(cafeteria.code)}`}
                      className="flex min-h-11 items-center justify-between rounded-md border border-line bg-surface px-4 py-2.5 text-base font-medium text-ink hover:bg-surface-muted"
                    >
                      <span>{localized.text}</span>
                      <ChevronRight
                        size={20}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="shrink-0 text-ink-muted"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
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
