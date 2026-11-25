import {
  DEFAULT_LANGUAGE,
  dietCompatibility,
  evaluate,
  isLanguage,
  localize,
  type DishView,
  type Language,
  type Prefs,
} from "@du-menu-scan/shared";
import { Utensils } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { readPrefs } from "../lib/prefs";
import { HiddenIngredientTag } from "./HiddenIngredientTag";
import { IconRow } from "./IconRow";
import { SpiceMeter } from "./SpiceMeter";
import { WarningBadge } from "./WarningBadge";

export interface DishCardProps {
  dish: DishView;
  /** Price in KRW, or null/undefined when included or not priced. */
  price?: number | null;
  /** Optional route to S3 dish detail (e.g. `/dish/${dish.id}?date=...`). */
  to?: string;
  /** Optional prefs override (defaults to `readPrefs()` from localStorage). */
  prefs?: Prefs;
  className?: string;
}

const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
});

export function DishCard({ dish, price, to, prefs, className = "" }: DishCardProps) {
  const { t, i18n } = useTranslation();
  const [imageError, setImageError] = useState(false);

  const lang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const activePrefs = prefs ?? readPrefs();
  const warning = evaluate(dish, activePrefs);
  const { vegetarian } = dietCompatibility(dish);
  const localizedName = localize(dish.name, lang);
  const hiddenIngredients = dish.ingredients.filter((ing) => ing.isHidden);

  const showTranslatedLine = lang !== "ko";
  const showPhoto = Boolean(dish.photoUrl) && !imageError;
  const isAvoid = warning.status === "avoid";

  const cardClasses = [
    "block rounded-md bg-surface p-3 shadow-card transition-colors",
    isAvoid ? "ring-2 ring-avoid-line" : "border border-line",
    to ? "hover:bg-surface-muted/40 focus-visible:outline-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <article
      data-testid={`dish-card-${dish.id}`}
      data-status={warning.status}
      className={cardClasses}
    >
      <div className="flex items-start gap-3">
        {showPhoto ? (
          <img
            src={dish.photoUrl!}
            alt={localizedName.text}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="h-16 w-16 shrink-0 rounded-sm bg-surface-muted object-cover"
          />
        ) : (
          <div
            data-testid={`dish-photo-placeholder-${dish.id}`}
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-ink-subtle"
          >
            <Utensils size={20} strokeWidth={2} />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-ink">{dish.name.ko}</h3>
              {showTranslatedLine && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="text-base font-normal text-ink-muted">{localizedName.text}</p>
                  {localizedName.isFallback && (
                    <span className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-ink-subtle">
                      {t("menu.translationPending")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {price !== null && price !== undefined && (
              <span className="shrink-0 text-sm font-medium text-ink-subtle tabular-nums">
                {krwFormatter.format(price)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <SpiceMeter level={dish.spiceLevel} />
            <IconRow tags={dish.dietTags} vegetarian={vegetarian} />
          </div>

          {hiddenIngredients.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {hiddenIngredients.map((ing) => (
                <HiddenIngredientTag key={ing.name.ko} name={localize(ing.name, lang).text} />
              ))}
            </div>
          )}

          {warning.status !== "ok" && (
            <div className="pt-0.5">
              <WarningBadge status={warning.status} />
            </div>
          )}
        </div>
      </div>
    </article>
  );

  if (to) {
    return (
      <Link to={to} className="block rounded-md">
        {content}
      </Link>
    );
  }

  return content;
}
