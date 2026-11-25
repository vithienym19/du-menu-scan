import { DEFAULT_LANGUAGE, isLanguage, localize, type Language } from "@du-menu-scan/shared";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { api } from "../lib/api";

/**
 * Fetches and renders the list of cafeterias linking each to `/r/:code`,
 * including loading and error-with-retry states.
 */
export function CafeteriaList() {
  const { t, i18n } = useTranslation();
  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  const cafeteriasQuery = useQuery({
    queryKey: ["cafeterias"],
    queryFn: () => api.listCafeterias(),
  });

  if (cafeteriasQuery.isPending) {
    return (
      <p role="status" className="text-sm text-ink-muted">
        {t("common.loading")}
      </p>
    );
  }

  if (cafeteriasQuery.isError) {
    return (
      <div role="alert">
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
    );
  }

  return (
    <ul className="space-y-2">
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
  );
}
