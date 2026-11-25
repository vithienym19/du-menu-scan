import {
  applyFilters,
  DEFAULT_LANGUAGE,
  isLanguage,
  localize,
  NO_FILTERS,
  sortByStatus,
  type Language,
  type MenuFilters,
  type MenuView,
  type OpeningHours,
} from "@du-menu-scan/shared";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Clock, RefreshCw, Settings, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { DishCard } from "../components/DishCard";
import { FilterChips } from "../components/FilterChips";
import { api } from "../lib/api";
import { clearCachedMenu, readCachedMenu, writeCachedMenu } from "../lib/menuCache";
import { usePrefs, useRequireOnboarding } from "../lib/prefs";

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function formatMenuDate(isoDate: string, lang: Language): string {
  const trimmed = isoDate.trim();
  if (!isValidIsoDate(trimmed)) return trimmed;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  try {
    return new Intl.DateTimeFormat(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  } catch {
    return trimmed;
  }
}

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

function TodayMenuSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="h-6 w-40 animate-pulse rounded-sm bg-surface-muted motion-reduce:animate-none" />
        <div className="h-11 w-28 animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-surface-muted motion-reduce:animate-none" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-surface-muted motion-reduce:animate-none" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-surface-muted motion-reduce:animate-none" />
      </div>

      <div className="h-6 w-28 animate-pulse rounded-sm bg-surface-muted motion-reduce:animate-none" />

      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-md border border-line bg-surface p-3 shadow-card"
          >
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-sm bg-surface-muted motion-reduce:animate-none" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-1/2 animate-pulse rounded-sm bg-surface-muted motion-reduce:animate-none" />
              <div className="h-4 w-2/3 animate-pulse rounded-sm bg-surface-muted motion-reduce:animate-none" />
              <div className="h-4 w-1/3 animate-pulse rounded-sm bg-surface-muted motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-ink-muted">{t("common.loading")}</p>
    </div>
  );
}

interface OpeningHoursListProps {
  openingHours: OpeningHours;
}

function OpeningHoursList({ openingHours }: OpeningHoursListProps) {
  const { t } = useTranslation();
  const rows: Array<{ key: "lunch" | "dinner"; label: string; value: string }> = [];

  if (openingHours.lunch) {
    rows.push({ key: "lunch", label: t("menu.lunch"), value: openingHours.lunch });
  }
  if (openingHours.dinner) {
    rows.push({ key: "dinner", label: t("menu.dinner"), value: openingHours.dinner });
  }

  if (rows.length === 0) return null;

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <Clock size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-muted" />
        <span>{t("menu.openingHours")}</span>
      </div>
      <dl className="mt-2 space-y-1.5 text-sm">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">{row.label}</dt>
            <dd className="font-medium text-ink tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface MenuTopBarProps {
  menu: MenuView | null;
  lang: Language;
}

function MenuTopBar({ menu, lang }: MenuTopBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {menu ? (
          <>
            <time dateTime={menu.date} className="text-sm font-medium text-ink-muted">
              {formatMenuDate(menu.date, lang)}
            </time>
            <span className="rounded-sm bg-surface-muted px-2 py-0.5 text-sm font-medium text-ink">
              {t(menu.meal === "lunch" ? "menu.lunch" : "menu.dinner")}
            </span>
          </>
        ) : null}
      </div>

      <Link
        to="/settings"
        aria-label={t("settings.title")}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md border border-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
      >
        <Settings size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        <span>{t("settings.title")}</span>
      </Link>
    </div>
  );
}

export function TodayMenuPage() {
  const { t, i18n } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const prefs = usePrefs();
  const isOnline = useOnlineStatus();

  useRequireOnboarding();

  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const trimmedCode = code?.trim() ?? "";

  const [filtersState, setFiltersState] = useState<{ code: string; value: MenuFilters }>({
    code: trimmedCode,
    value: NO_FILTERS,
  });
  const filters = filtersState.code === trimmedCode ? filtersState.value : NO_FILTERS;
  const setFilters = (next: MenuFilters) => {
    setFiltersState({ code: trimmedCode, value: next });
  };

  const menuQuery = useQuery({
    queryKey: ["todayMenu", trimmedCode],
    queryFn: () => api.getTodayMenu(trimmedCode),
    enabled: Boolean(trimmedCode),
  });

  useEffect(() => {
    if (!trimmedCode || menuQuery.isPending || menuQuery.isError) return;
    if (menuQuery.data) {
      writeCachedMenu(trimmedCode, menuQuery.data);
    } else if (menuQuery.data === null && isOnline) {
      clearCachedMenu(trimmedCode);
    }
  }, [trimmedCode, menuQuery.data, menuQuery.isPending, menuQuery.isError, isOnline]);

  const cachedMenu = trimmedCode ? readCachedMenu(trimmedCode) : null;
  const isExplicitNotFound =
    !trimmedCode ||
    (!menuQuery.isPending && !menuQuery.isError && menuQuery.data === null && isOnline);

  let menu: MenuView | null = null;
  let showOfflineBanner = false;

  if (menuQuery.data) {
    menu = menuQuery.data;
    showOfflineBanner = !isOnline || menuQuery.isError;
  } else if (!isExplicitNotFound && (!isOnline || menuQuery.isError) && cachedMenu) {
    menu = cachedMenu;
    showOfflineBanner = true;
  }

  const cafeteriasQuery = useQuery({
    queryKey: ["cafeterias"],
    queryFn: () => api.listCafeterias(),
    enabled: isExplicitNotFound,
  });

  const headerTitle = menu ? localize(menu.cafeteria.name, currentLang).text : t("menu.title");

  if (trimmedCode && !menu && menuQuery.isPending && isOnline) {
    return (
      <AppShell title={headerTitle}>
        <TodayMenuSkeleton />
      </AppShell>
    );
  }

  if (!menu && (menuQuery.isError || (!isOnline && Boolean(trimmedCode)))) {
    return (
      <AppShell title={headerTitle}>
        <div className="space-y-4">
          <MenuTopBar menu={null} lang={currentLang} />

          <section
            role="alert"
            className="rounded-md border border-line bg-surface p-4 shadow-card"
          >
            <h2 className="text-lg font-bold text-ink">{t("menu.errorTitle")}</h2>
            <p className="mt-1 text-base text-ink-muted">
              {isOnline ? t("menu.errorBody") : t("menu.offline")}
            </p>
            <button
              type="button"
              onClick={() => void menuQuery.refetch()}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-base font-semibold text-surface hover:bg-brand-strong"
            >
              <RefreshCw size={20} strokeWidth={2} aria-hidden="true" />
              <span>{t("common.retry")}</span>
            </button>
          </section>
        </div>
      </AppShell>
    );
  }

  if (!menu || isExplicitNotFound) {
    return (
      <AppShell title={headerTitle}>
        <div className="space-y-4">
          <MenuTopBar menu={null} lang={currentLang} />

          <section className="rounded-md border border-line bg-surface p-4 shadow-card">
            <h2 className="text-lg font-bold text-ink">{t("entry.invalidTitle")}</h2>
            <p className="mt-1 text-base text-ink-muted">{t("entry.invalidBody")}</p>

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
                        to={`/r/${encodeURIComponent(cafeteria.code)}/today`}
                        className="flex min-h-11 items-center justify-between rounded-md border border-line bg-surface px-4 py-2.5 text-base font-medium text-ink hover:bg-surface-muted"
                      >
                        <span lang={localized.lang}>{localized.text}</span>
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
        </div>
      </AppShell>
    );
  }

  const totalDishes = menu.corners.reduce((sum, corner) => sum + corner.items.length, 0);
  const currentLocation = `${location.pathname}${location.search}`;

  const processedCorners =
    menu.status === "published"
      ? menu.corners
          .map((corner) => ({
            corner,
            items: sortByStatus(applyFilters(corner.items, filters), prefs),
          }))
          .filter((entry) => entry.items.length > 0)
      : [];

  return (
    <AppShell title={headerTitle}>
      <div className="space-y-4 pb-6">
        <MenuTopBar menu={menu} lang={currentLang} />

        {showOfflineBanner ? (
          <div
            role="status"
            data-testid="offline-banner"
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted p-3 text-sm font-medium text-ink"
          >
            <div className="flex items-center gap-2">
              <WifiOff
                size={20}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0 text-ink-muted"
              />
              <span>{t("menu.offline")}</span>
            </div>
            {menuQuery.isError ? (
              <button
                type="button"
                onClick={() => void menuQuery.refetch()}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface px-3 text-sm font-semibold text-brand hover:bg-brand-soft"
              >
                {t("common.retry")}
              </button>
            ) : null}
          </div>
        ) : null}

        {menu.status === "closed" ? (
          <section
            data-testid="menu-closed-state"
            className="rounded-md border border-line bg-surface p-4 shadow-card"
          >
            <h2 className="text-lg font-bold text-ink">{t("menu.closedTitle")}</h2>
            <p className="mt-1 text-base text-ink-muted">{t("menu.closedBody")}</p>
            <OpeningHoursList openingHours={menu.cafeteria.openingHours} />
          </section>
        ) : menu.status === "empty" || totalDishes === 0 ? (
          <section
            data-testid="menu-empty-state"
            className="rounded-md border border-line bg-surface p-4 shadow-card"
          >
            <h2 className="text-lg font-bold text-ink">{t("menu.emptyTitle")}</h2>
            <p className="mt-1 text-base text-ink-muted">{t("menu.emptyBody")}</p>
            <OpeningHoursList openingHours={menu.cafeteria.openingHours} />
          </section>
        ) : (
          <>
            <FilterChips value={filters} onChange={setFilters} />

            {processedCorners.length === 0 ? (
              <section
                data-testid="menu-no-results-state"
                className="rounded-md border border-line bg-surface p-4 shadow-card"
              >
                <p className="text-base font-medium text-ink">{t("menu.noResults")}</p>
                <button
                  type="button"
                  onClick={() => setFilters(NO_FILTERS)}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md border border-line bg-surface px-4 text-base font-semibold text-brand hover:bg-brand-soft"
                >
                  {t("menu.clearFilters")}
                </button>
              </section>
            ) : (
              <div>
                {processedCorners.map(({ corner, items }) => {
                  const localizedCorner = localize(corner.name, currentLang);
                  const headingId = `corner-heading-${corner.id}`;
                  return (
                    <section
                      key={corner.id}
                      aria-labelledby={headingId}
                      data-testid={`corner-section-${corner.id}`}
                      className="mt-6 first:mt-2"
                    >
                      <h2
                        id={headingId}
                        lang={localizedCorner.lang}
                        className="mb-2 text-lg font-bold text-ink"
                      >
                        {localizedCorner.text}
                      </h2>
                      <ul className="space-y-3">
                        {items.map((item) => {
                          const dishUrl = `/dish/${encodeURIComponent(item.dish.id)}?date=${encodeURIComponent(menu.date)}`;
                          return (
                            <li key={item.dish.id}>
                              <DishCard
                                dish={item.dish}
                                price={item.price}
                                to={dishUrl}
                                linkState={{ from: currentLocation }}
                                prefs={prefs}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
