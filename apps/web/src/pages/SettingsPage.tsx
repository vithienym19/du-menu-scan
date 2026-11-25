import {
  DEFAULT_LANGUAGE,
  expandDietType,
  isLanguage,
  LANGUAGES,
  type AllergenCode,
  type DietTag,
  type DietType,
  type Language,
  type SpiceLevel,
} from "@du-menu-scan/shared";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { changeAppLanguage } from "../lib/i18n";
import { readPrefs, writePrefs } from "../lib/prefs";

interface AvoidTagOption {
  kind: "tag";
  id: string;
  tag: DietTag;
  emoji: string;
  labelKey: "tags.pork" | "tags.beef" | "tags.chicken" | "tags.seafood";
}

interface AvoidAllergenOption {
  kind: "allergen";
  id: string;
  codes: readonly AllergenCode[];
  labelKey: "settings.nuts" | "settings.milkEgg" | "settings.wheat";
}

type AvoidOption = AvoidTagOption | AvoidAllergenOption;

const AVOID_OPTIONS: readonly AvoidOption[] = [
  { kind: "tag", id: "pork", tag: "pork", emoji: "🐷", labelKey: "tags.pork" },
  { kind: "tag", id: "beef", tag: "beef", emoji: "🐄", labelKey: "tags.beef" },
  { kind: "tag", id: "chicken", tag: "chicken", emoji: "🐔", labelKey: "tags.chicken" },
  { kind: "tag", id: "seafood", tag: "seafood", emoji: "🐟", labelKey: "tags.seafood" },
  {
    kind: "allergen",
    id: "nuts",
    codes: ["peanut", "walnut", "pine_nut"],
    labelKey: "settings.nuts",
  },
  {
    kind: "allergen",
    id: "milkEgg",
    codes: ["milk", "egg"],
    labelKey: "settings.milkEgg",
  },
  {
    kind: "allergen",
    id: "wheat",
    codes: ["wheat"],
    labelKey: "settings.wheat",
  },
];

const CHECKBOX_TAGS = new Set<DietTag>(
  AVOID_OPTIONS.flatMap((opt) => (opt.kind === "tag" ? [opt.tag] : [])),
);

const MANAGED_ALLERGEN_CODES = new Set<AllergenCode>(
  AVOID_OPTIONS.flatMap((opt) => (opt.kind === "allergen" ? opt.codes : [])),
);

const SPICE_OPTIONS: ReadonlyArray<{
  value: SpiceLevel;
  labelKey: "settings.spiceNone" | "settings.spiceSome" | "settings.spiceAny";
}> = [
  { value: 0, labelKey: "settings.spiceNone" },
  { value: 2, labelKey: "settings.spiceSome" },
  { value: 4, labelKey: "settings.spiceAny" },
];

const DIET_TYPE_OPTIONS: ReadonlyArray<{
  value: DietType;
  labelKey: "settings.dietNone" | "settings.dietVegetarian" | "settings.dietHalal";
}> = [
  { value: "none", labelKey: "settings.dietNone" },
  { value: "vegetarian", labelKey: "settings.dietVegetarian" },
  { value: "halal", labelKey: "settings.dietHalal" },
];

/**
 * Maps any stored spiceTolerance (0..4) down to one of the S4 radio values (0, 2, 4)
 * so saving S4 never loosens a student's spice tolerance (D-023).
 */
export function normalizeSpiceOption(level: SpiceLevel): SpiceLevel {
  if (level <= 1) return 0;
  if (level <= 3) return 2;
  return 4;
}

function isSafeInternalPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [initialPrefs] = useState(() => readPrefs());

  const [avoidTags, setAvoidTags] = useState<DietTag[]>(() => {
    const implied = expandDietType(initialPrefs.dietType);
    return [...new Set([...initialPrefs.avoidTags, ...implied])].filter((tag) =>
      CHECKBOX_TAGS.has(tag),
    );
  });

  const [avoidAllergens, setAvoidAllergens] = useState<AllergenCode[]>(
    () => initialPrefs.avoidAllergens,
  );

  const [spiceTolerance, setSpiceTolerance] = useState<SpiceLevel>(() =>
    normalizeSpiceOption(initialPrefs.spiceTolerance),
  );

  const [dietType, setDietType] = useState<DietType>(() => initialPrefs.dietType);

  const impliedTagSet = new Set<DietTag>(expandDietType(dietType));

  const currentLang: Language = isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;

  const handleLanguageChange = (lang: Language) => {
    void changeAppLanguage(lang);
  };

  const handleDietTypeChange = (nextDiet: DietType) => {
    setDietType(nextDiet);
    const impliedTags = expandDietType(nextDiet).filter((tag) => CHECKBOX_TAGS.has(tag));
    if (impliedTags.length > 0) {
      setAvoidTags((prev) => [...new Set([...prev, ...impliedTags])]);
    }
  };

  const handleToggleTag = (tag: DietTag, checked: boolean) => {
    if (impliedTagSet.has(tag)) return;
    setAvoidTags((prev) => {
      if (checked) {
        return prev.includes(tag) ? prev : [...prev, tag];
      }
      return prev.filter((item) => item !== tag);
    });
  };

  const handleToggleAllergenGroup = (codes: readonly AllergenCode[], checked: boolean) => {
    setAvoidAllergens((prev) => {
      const codeSet = new Set(codes);
      const withoutGroup = prev.filter((code) => !codeSet.has(code));
      return checked ? [...withoutGroup, ...codes] : withoutGroup;
    });
  };

  const isAllergenGroupChecked = (codes: readonly AllergenCode[]): boolean => {
    return codes.some((code) => avoidAllergens.includes(code));
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const impliedTags = expandDietType(dietType);
    const visibleTags = avoidTags.filter((tag) => CHECKBOX_TAGS.has(tag));
    const finalTags = [...new Set([...visibleTags, ...impliedTags])];
    const preservedExtraAllergens = initialPrefs.avoidAllergens.filter(
      (code) => !MANAGED_ALLERGEN_CODES.has(code),
    );
    const finalAllergens = [...new Set([...preservedExtraAllergens, ...avoidAllergens])];

    writePrefs({
      lang: currentLang,
      avoidTags: finalTags,
      avoidAllergens: finalAllergens,
      spiceTolerance,
      dietType,
      onboarded: true,
    });

    const nextParam = searchParams.get("next");
    if (isSafeInternalPath(nextParam)) {
      navigate(nextParam, { replace: true });
      return;
    }

    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx === 0 && location.key === "default") {
      navigate("/");
      return;
    }

    navigate(-1);
  };

  return (
    <AppShell title={t("settings.title")}>
      <form onSubmit={handleSave} className="space-y-6 pb-8">
        {/* Language selector */}
        <fieldset className="rounded-md border border-line bg-surface p-4 shadow-card">
          <legend className="px-1 text-lg font-bold text-ink">{t("common.language")}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
              const selected = lang.code === currentLang;
              return (
                <label
                  key={lang.code}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-base transition-colors duration-150 ${
                    selected
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-surface font-normal text-ink hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="language"
                    value={lang.code}
                    checked={selected}
                    onChange={() => handleLanguageChange(lang.code)}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <span>{lang.nativeName}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Diet type */}
        <fieldset className="rounded-md border border-line bg-surface p-4 shadow-card">
          <legend className="px-1 text-lg font-bold text-ink">{t("settings.dietType")}</legend>
          <div className="mt-2 flex flex-col gap-2">
            {DIET_TYPE_OPTIONS.map((option) => {
              const selected = dietType === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-base transition-colors duration-150 ${
                    selected
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-surface font-normal text-ink hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="dietType"
                    value={option.value}
                    checked={selected}
                    onChange={() => handleDietTypeChange(option.value)}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <span>{t(option.labelKey)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* I avoid checkboxes */}
        <fieldset className="rounded-md border border-line bg-surface p-4 shadow-card">
          <legend className="px-1 text-lg font-bold text-ink">{t("settings.iAvoid")}</legend>
          <div className="mt-2 flex flex-col gap-2">
            {AVOID_OPTIONS.map((option) => {
              const isImplied = option.kind === "tag" && impliedTagSet.has(option.tag);
              const checked =
                option.kind === "tag"
                  ? isImplied || avoidTags.includes(option.tag)
                  : isAllergenGroupChecked(option.codes);

              return (
                <label
                  key={option.id}
                  className={`flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-base transition-colors duration-150 ${
                    isImplied ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                  } ${
                    checked
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-surface font-normal text-ink hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="checkbox"
                    name={`avoid-${option.id}`}
                    checked={checked}
                    disabled={isImplied}
                    onChange={(e) => {
                      if (option.kind === "tag") {
                        handleToggleTag(option.tag, e.target.checked);
                      } else {
                        handleToggleAllergenGroup(option.codes, e.target.checked);
                      }
                    }}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  {option.kind === "tag" ? (
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm"
                      aria-hidden="true"
                    >
                      {option.emoji}
                    </span>
                  ) : null}
                  <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-2">
                    <span>{t(option.labelKey)}</span>
                    {isImplied ? (
                      <span className="text-xs font-normal text-ink-muted">
                        {t("settings.includedInDiet")}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Spice tolerance */}
        <fieldset className="rounded-md border border-line bg-surface p-4 shadow-card">
          <legend className="px-1 text-lg font-bold text-ink">
            {t("settings.spiceTolerance")}
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {SPICE_OPTIONS.map((option) => {
              const selected = spiceTolerance === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-base transition-colors duration-150 ${
                    selected
                      ? "border-brand bg-brand-soft font-semibold text-brand"
                      : "border-line bg-surface font-normal text-ink hover:bg-surface-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="spiceTolerance"
                    value={option.value}
                    checked={selected}
                    onChange={() => setSpiceTolerance(option.value)}
                    className="h-4 w-4 shrink-0 accent-brand"
                  />
                  <span>{t(option.labelKey)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <p className="text-center text-sm text-ink-muted">{t("settings.privacyNote")}</p>

        <button
          type="submit"
          className="inline-flex h-12 min-h-11 w-full items-center justify-center rounded-md bg-brand px-4 text-base font-semibold text-surface transition-colors duration-150 hover:bg-brand-strong active:bg-brand-strong"
        >
          {t("common.save")}
        </button>
      </form>
    </AppShell>
  );
}
