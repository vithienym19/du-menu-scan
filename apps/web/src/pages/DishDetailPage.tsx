import {
  DEFAULT_LANGUAGE,
  dietCompatibility,
  evaluate,
  isLanguage,
  LANGUAGES,
  localize,
  type DishView,
  type Language,
  type WarningReason,
  type WarningResult,
} from "@du-menu-scan/shared";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  TriangleAlert,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { IconRow } from "../components/IconRow";
import { SpiceMeter } from "../components/SpiceMeter";
import { WarningBadge } from "../components/WarningBadge";
import { api } from "../lib/api";
import { readPrefs } from "../lib/prefs";

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function formatIsoDate(isoDate: string, lang: Language): string {
  const trimmed = isoDate.trim();
  if (!isValidIsoDate(trimmed)) {
    return trimmed;
  }
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

function formatWarningReason(
  reason: WarningReason,
  dish: DishView,
  lang: Language,
  t: TFunction,
): string {
  switch (reason.kind) {
    case "tag":
      return t("status.reasonContains", { item: t(`tags.${reason.code}`) });
    case "allergen": {
      const allergen = dish.allergens.find((item) => item.code === reason.code);
      const label = allergen ? localize(allergen.name, lang).text : reason.code;
      return t("status.reasonContains", { item: label });
    }
    case "spice":
      return t("status.reasonSpicy");
  }
}

function warningReasonKey(reason: WarningReason): string {
  switch (reason.kind) {
    case "tag":
      return `tag-${reason.code}`;
    case "allergen":
      return `allergen-${reason.code}`;
    case "spice":
      return `spice-${reason.level}-${reason.tolerance}`;
  }
}

interface WarningBannerProps {
  warning: WarningResult;
  dish: DishView;
  lang: Language;
}

function WarningBanner({ warning, dish, lang }: WarningBannerProps) {
  const { t } = useTranslation();

  if (warning.status === "ok") {
    return null;
  }

  if (warning.status === "avoid") {
    return (
      <div className="space-y-3">
        <section
          role="region"
          aria-label={t("status.avoid")}
          data-testid="warning-banner-avoid"
          className="rounded-lg border-2 border-avoid-line bg-avoid-soft p-4 text-avoid"
        >
          <div className="flex items-center gap-2">
            <Ban size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <h3 className="text-base font-bold">{t("status.avoid")}</h3>
          </div>
          {warning.reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm font-medium">
              {warning.reasons.map((reason) => (
                <li key={warningReasonKey(reason)}>{formatWarningReason(reason, dish, lang, t)}</li>
              ))}
            </ul>
          )}
        </section>

        {warning.unverified && (
          <section
            role="region"
            aria-label={t("status.unverified")}
            data-testid="warning-banner-unverified-note"
            className="flex items-start gap-2.5 rounded-lg border border-unverified-line bg-unverified-soft p-3 text-unverified"
          >
            <CircleHelp size={20} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold">{t("status.unverified")}</p>
              <p className="mt-0.5 text-sm font-medium">{t("status.reasonUnverified")}</p>
            </div>
          </section>
        )}
      </div>
    );
  }

  if (warning.status === "unverified") {
    return (
      <section
        role="region"
        aria-label={t("status.unverified")}
        data-testid="warning-banner-unverified"
        className="rounded-lg border border-unverified-line bg-unverified-soft p-4 text-unverified"
      >
        <div className="flex items-center gap-2">
          <CircleHelp size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />
          <h3 className="text-base font-bold">{t("status.unverified")}</h3>
        </div>
        <p className="mt-1.5 text-sm font-medium">{t("status.reasonUnverified")}</p>
        {warning.reasons.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm font-medium">
            {warning.reasons.map((reason) => (
              <li key={warningReasonKey(reason)}>{formatWarningReason(reason, dish, lang, t)}</li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section
      role="region"
      aria-label={t("status.caution")}
      data-testid="warning-banner-caution"
      className="rounded-lg border border-caution-line bg-caution-soft p-4 text-caution"
    >
      <div className="flex items-center gap-2">
        <TriangleAlert size={20} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        <h3 className="text-base font-bold">{t("status.caution")}</h3>
      </div>
      {warning.reasons.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm font-medium">
          {warning.reasons.map((reason) => (
            <li key={warningReasonKey(reason)}>{formatWarningReason(reason, dish, lang, t)}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface DietRowProps {
  label: string;
  compatible: boolean | null;
  testId: string;
}

function DietRow({ label, compatible, testId }: DietRowProps) {
  const { t } = useTranslation();

  return (
    <div
      data-testid={testId}
      data-diet-value={compatible === null ? "unknown" : String(compatible)}
      className="flex items-center justify-between gap-3 py-2"
    >
      <dt className="text-base font-medium text-ink">{label}</dt>
      <dd className="inline-flex items-center gap-1.5 text-sm font-semibold">
        {compatible === true ? (
          <>
            <Check size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink" />
            <span className="text-ink">{t("dish.suitable")}</span>
          </>
        ) : compatible === false ? (
          <>
            <X size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-muted" />
            <span className="text-ink-muted">{t("dish.notSuitable")}</span>
          </>
        ) : (
          <>
            <CircleHelp
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-ink-muted"
            />
            <span className="text-ink-muted">{t("dish.dietUnknown")}</span>
          </>
        )}
      </dd>
    </div>
  );
}

function DishDetailSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-surface-muted" />
      <div className="space-y-3 rounded-md border border-line bg-surface p-4 shadow-card">
        <div className="h-6 w-24 animate-pulse rounded-sm bg-surface-muted" />
        <div className="h-8 w-2/3 animate-pulse rounded-sm bg-surface-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded-sm bg-surface-muted" />
      </div>
      <div className="space-y-3 rounded-md border border-line bg-surface p-4 shadow-card">
        <div className="h-5 w-1/3 animate-pulse rounded-sm bg-surface-muted" />
        <div className="h-4 w-full animate-pulse rounded-sm bg-surface-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded-sm bg-surface-muted" />
      </div>
      <p className="text-center text-sm text-ink-muted">{t("common.loading")}</p>
    </div>
  );
}

export function DishDetailPage() {
  const { t, i18n } = useTranslation();
  const { dishId } = useParams<{ dishId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);

  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const trimmedDishId = dishId?.trim() ?? "";
  const rawDateParam = searchParams.get("date")?.trim() ?? "";
  const validDateParam = isValidIsoDate(rawDateParam) ? rawDateParam : null;

  const dishQuery = useQuery({
    queryKey: ["dish", trimmedDishId],
    queryFn: () => api.getDish(trimmedDishId),
    enabled: Boolean(trimmedDishId),
  });

  const handleBackToMenu = () => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from) {
      navigate(from);
      return;
    }
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (!idx) {
      navigate("/");
      return;
    }
    navigate(-1);
  };

  if (trimmedDishId && dishQuery.isPending) {
    return (
      <AppShell title={t("dish.description")}>
        <DishDetailSkeleton />
      </AppShell>
    );
  }

  if (trimmedDishId && dishQuery.isError) {
    return (
      <AppShell title={t("dish.description")}>
        <div className="space-y-4">
          <section
            role="alert"
            className="rounded-md border border-line bg-surface p-4 shadow-card"
          >
            <h2 className="text-lg font-bold text-ink">{t("menu.errorTitle")}</h2>
            <p className="mt-1 text-base text-ink-muted">{t("menu.errorBody")}</p>
            <button
              type="button"
              onClick={() => void dishQuery.refetch()}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-brand px-4 text-base font-semibold text-surface hover:bg-brand-strong"
            >
              {t("common.retry")}
            </button>
          </section>

          <button
            type="button"
            onClick={handleBackToMenu}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-base font-semibold text-ink hover:bg-surface-muted"
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
            <span>{t("dish.backToMenu")}</span>
          </button>
        </div>
      </AppShell>
    );
  }

  const dish = dishQuery.data;

  if (!trimmedDishId || !dish) {
    return (
      <AppShell title={t("dish.description")}>
        <div className="space-y-4">
          <section className="rounded-md border border-line bg-surface p-4 shadow-card">
            <h2 className="text-xl font-bold text-ink">{t("notFound.title")}</h2>
            <p className="mt-2 text-base text-ink-muted">{t("notFound.body")}</p>
          </section>

          <button
            type="button"
            onClick={handleBackToMenu}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-base font-semibold text-ink hover:bg-surface-muted"
          >
            <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
            <span>{t("dish.backToMenu")}</span>
          </button>
        </div>
      </AppShell>
    );
  }

  const prefs = readPrefs();
  const warning = evaluate(dish, prefs);
  const diet = dietCompatibility(dish);
  const localizedName = localize(dish.name, currentLang);
  const localizedDescription = dish.description ? localize(dish.description, currentLang) : null;

  const shownLanguages = new Set<Language>(["ko", currentLang, localizedName.lang]);
  const otherLanguageNames = LANGUAGES.flatMap((langInfo) => {
    if (shownLanguages.has(langInfo.code)) {
      return [];
    }
    const text = dish.name[langInfo.code]?.trim();
    if (!text) {
      return [];
    }
    return [{ langInfo, text }];
  });

  const mainIngredients = dish.ingredients.filter((ingredient) => ingredient.isMain);
  const hiddenIngredients = dish.ingredients.filter((ingredient) => ingredient.isHidden);
  const avoidedAllergenCodes = new Set(
    warning.reasons
      .filter(
        (reason): reason is Extract<WarningReason, { kind: "allergen" }> =>
          reason.kind === "allergen",
      )
      .map((reason) => reason.code),
  );

  const showPhoto = Boolean(dish.photoUrl) && failedPhotoUrl !== dish.photoUrl;
  const verifiedText =
    dish.verifiedAt && dish.verifiedAt.trim().length > 0
      ? t("dish.lastVerified", { date: formatIsoDate(dish.verifiedAt, currentLang) })
      : t("dish.neverVerified");

  return (
    <AppShell title={localizedName.text}>
      <article className="space-y-4 pb-6">
        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          <div className="aspect-[4/3] w-full bg-surface-muted">
            {showPhoto && dish.photoUrl ? (
              <img
                src={dish.photoUrl}
                alt={localizedName.text}
                loading="lazy"
                decoding="async"
                onError={() => setFailedPhotoUrl(dish.photoUrl)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                data-testid="dish-photo-placeholder"
                className="flex h-full w-full items-center justify-center text-ink-subtle"
              >
                <UtensilsCrossed size={40} strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <WarningBadge status={warning.status} showOk={true} />
              {validDateParam && (
                <time dateTime={validDateParam} className="text-xs font-medium text-ink-subtle">
                  {formatIsoDate(validDateParam, currentLang)}
                </time>
              )}
            </div>

            <h2 lang="ko" className="mt-3 text-2xl font-bold text-ink">
              {dish.name.ko}
            </h2>

            {currentLang !== "ko" && localizedName.lang !== "ko" && (
              <p lang={localizedName.lang} className="mt-1 text-base font-medium text-ink-muted">
                {localizedName.text}
              </p>
            )}

            {localizedName.isFallback && (
              <p
                data-testid="translation-pending-name"
                className="mt-2 inline-flex items-center rounded-sm bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted"
              >
                {t("menu.translationPending")}
              </p>
            )}

            {otherLanguageNames.length > 0 && (
              <details className="group mt-3 border-t border-line pt-1">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-sm px-1 text-sm font-semibold text-brand hover:text-brand-strong [&::-webkit-details-marker]:hidden">
                  <span>{t("dish.otherLanguages")}</span>
                  <ChevronDown
                    size={20}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0 transition-transform duration-150 ease-out-soft group-open:rotate-180"
                  />
                </summary>
                <dl className="mt-1 space-y-1.5 px-1 pb-2 text-sm">
                  {otherLanguageNames.map(({ langInfo, text }) => (
                    <div key={langInfo.code} className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 font-medium text-ink-muted">{langInfo.nativeName}</dt>
                      <dd lang={langInfo.code} className="text-right font-medium text-ink">
                        {text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>
        </div>

        <WarningBanner warning={warning} dish={dish} lang={currentLang} />

        <section className="space-y-4 rounded-md border border-line bg-surface p-4 shadow-card">
          {localizedDescription && (
            <div>
              <h3 className="text-lg font-bold text-ink">{t("dish.description")}</h3>
              <p lang={localizedDescription.lang} className="mt-1 text-base text-ink-muted">
                {localizedDescription.text}
              </p>
              {localizedDescription.isFallback && (
                <p
                  data-testid="translation-pending-description"
                  className="mt-2 inline-flex items-center rounded-sm bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted"
                >
                  {t("menu.translationPending")}
                </p>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-ink">{t("dish.spiceLevel")}</h3>
            <div className="mt-2">
              <SpiceMeter level={dish.spiceLevel} />
            </div>
          </div>

          {(dish.dietTags.length > 0 || diet.vegetarian === true) && (
            <div className="border-t border-line pt-3">
              <IconRow tags={dish.dietTags} vegetarian={diet.vegetarian} />
            </div>
          )}
        </section>

        <section className="space-y-5 rounded-md border border-line bg-surface p-4 shadow-card">
          <div>
            <h3 className="text-lg font-bold text-ink">{t("dish.mainIngredients")}</h3>
            {mainIngredients.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {mainIngredients.map((ingredient, index) => {
                  const localized = localize(ingredient.name, currentLang);
                  return (
                    <li
                      key={`${ingredient.name.ko}-${index}`}
                      lang={localized.lang}
                      className="rounded-sm border border-line bg-surface-muted px-2.5 py-1 text-sm font-medium text-ink"
                    >
                      {localized.text}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">
                {warning.unverified ? t("dish.dietUnknown") : t("dish.noneListed")}
              </p>
            )}
          </div>

          <div className="border-t border-line pt-4">
            <div className="flex items-center gap-2">
              <TriangleAlert
                size={20}
                strokeWidth={2}
                aria-hidden="true"
                className="shrink-0 text-caution"
              />
              <h3 className="text-lg font-bold text-ink">{t("dish.hiddenIngredients")}</h3>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{t("dish.hiddenIngredientsHint")}</p>

            {hiddenIngredients.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {hiddenIngredients.map((ingredient, index) => {
                  const localized = localize(ingredient.name, currentLang);
                  return (
                    <li
                      key={`${ingredient.name.ko}-${index}`}
                      className="flex items-center gap-2 rounded-sm border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink"
                    >
                      <TriangleAlert
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="shrink-0 text-caution"
                      />
                      <span lang={localized.lang}>{localized.text}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">
                {warning.unverified ? t("dish.dietUnknown") : t("dish.noneListed")}
              </p>
            )}
          </div>
        </section>

        <section className="rounded-md border border-line bg-surface p-4 shadow-card">
          <h3 className="text-lg font-bold text-ink">{t("dish.allergens")}</h3>
          {dish.allergens.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {dish.allergens.map((allergen) => {
                const localized = localize(allergen.name, currentLang);
                const isAvoided = avoidedAllergenCodes.has(allergen.code);
                return (
                  <li
                    key={allergen.code}
                    lang={localized.lang}
                    className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-sm font-medium ${
                      isAvoided
                        ? "border-avoid-line bg-avoid-soft font-semibold text-avoid"
                        : "border-line bg-surface-muted text-ink"
                    }`}
                  >
                    {isAvoided && (
                      <Ban size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                    )}
                    <span>{localized.text}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              {dish.allergensConfirmed ? t("dish.noneListed") : t("dish.dietUnknown")}
            </p>
          )}
        </section>

        <section className="rounded-md border border-line bg-surface p-4 shadow-card">
          <h3 className="text-lg font-bold text-ink">{t("dish.dietInfo")}</h3>
          <dl className="mt-2 divide-y divide-line">
            <DietRow label={t("dish.halal")} compatible={diet.halal} testId="diet-row-halal" />
            <DietRow
              label={t("dish.vegetarian")}
              compatible={diet.vegetarian}
              testId="diet-row-vegetarian"
            />
          </dl>
        </section>

        <footer
          data-testid="safety-footer"
          className="space-y-1 rounded-md bg-surface-muted p-4 text-sm text-ink-muted"
        >
          <p className="font-medium">{verifiedText}</p>
          <p>{t("dish.confirmWithStaff")}</p>
        </footer>

        <button
          type="button"
          onClick={handleBackToMenu}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-line bg-surface px-4 text-base font-semibold text-ink hover:bg-surface-muted"
        >
          <ChevronLeft size={20} strokeWidth={2} aria-hidden="true" />
          <span>{t("dish.backToMenu")}</span>
        </button>
      </article>
    </AppShell>
  );
}
