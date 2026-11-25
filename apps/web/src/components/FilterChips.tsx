import type { MenuFilters } from "@du-menu-scan/shared";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface FilterChipsProps {
  value: MenuFilters;
  onChange: (next: MenuFilters) => void;
  className?: string;
}

const FILTER_OPTIONS: ReadonlyArray<{
  key: keyof MenuFilters;
  labelKey: "menu.filterNotSpicy" | "menu.filterNoPork" | "menu.filterVegetarian";
}> = [
  { key: "notSpicy", labelKey: "menu.filterNotSpicy" },
  { key: "noPork", labelKey: "menu.filterNoPork" },
  { key: "vegetarian", labelKey: "menu.filterVegetarian" },
];

export function FilterChips({ value, onChange, className }: FilterChipsProps) {
  const { t } = useTranslation();

  const toggle = (key: keyof MenuFilters) => {
    onChange({
      ...value,
      [key]: !value[key],
    });
  };

  return (
    <div
      role="group"
      aria-label={t("menu.filters")}
      className={`flex flex-wrap gap-x-2 gap-y-1${className ? ` ${className}` : ""}`}
    >
      {FILTER_OPTIONS.map(({ key, labelKey }) => {
        const active = value[key];
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(key)}
            className="group inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors duration-150 ease-out-soft motion-reduce:transition-none ${
                active
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line bg-surface text-ink group-hover:bg-surface-muted"
              }`}
            >
              {active ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : null}
              <span>{t(labelKey)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
