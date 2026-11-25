import type { DietTag } from "@du-menu-scan/shared";
import { useTranslation } from "react-i18next";

export interface IconRowProps {
  tags: readonly DietTag[];
  /** Vegetarian flag from dietCompatibility(): true shows the vegetarian badge, false/null omits it. */
  vegetarian: boolean | null;
  className?: string;
}

const TAG_META: Record<DietTag, { emoji: string; labelKey: string }> = {
  pork: { emoji: "🐷", labelKey: "tags.pork" },
  beef: { emoji: "🐄", labelKey: "tags.beef" },
  chicken: { emoji: "🐔", labelKey: "tags.chicken" },
  seafood: { emoji: "🐟", labelKey: "tags.seafood" },
  alcohol: { emoji: "🍺", labelKey: "tags.alcohol" },
};

const TAG_ORDER: readonly DietTag[] = ["pork", "beef", "chicken", "seafood", "alcohol"];

export function IconRow({ tags, vegetarian, className = "" }: IconRowProps) {
  const { t } = useTranslation();

  const tagSet = new Set(tags);
  const orderedTags = TAG_ORDER.filter((tag) => tagSet.has(tag));

  if (orderedTags.length === 0 && vegetarian !== true) {
    return null;
  }

  return (
    <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${className}`.trim()}>
      {orderedTags.map((tag) => {
        const { emoji, labelKey } = TAG_META[tag];
        return (
          <li key={tag} className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm"
              aria-hidden="true"
            >
              {emoji}
            </span>
            <span className="text-sm font-medium text-ink-muted">{t(labelKey)}</span>
          </li>
        );
      })}
      {vegetarian === true && (
        <li className="inline-flex items-center gap-1.5">
          <span
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm"
            aria-hidden="true"
          >
            🥬
          </span>
          <span className="text-sm font-medium text-ink-muted">{t("tags.vegetarian")}</span>
        </li>
      )}
    </ul>
  );
}
