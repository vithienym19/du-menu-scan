/*
 * SAFETY-CRITICAL. Single source of truth for personal dish warnings (BR6).
 * The UI must never compute warning status, diet compatibility, sorting or
 * filtering itself — it calls these functions.
 *
 * Rules (product/technical-architecture.md §4, decision D-017):
 *   1. Any avoided diet tag or allergen present (hidden ingredients included) → "avoid".
 *      This wins even when the rest of the data is unverified: a known hit is the
 *      strongest, most useful signal for the student.
 *   2. Otherwise, unverified or incomplete data → "unverified". Never "ok".
 *   3. Otherwise, spice level above the student's tolerance → "caution".
 *   4. Otherwise → "ok".
 */
import { DEFAULT_LANGUAGE, isLanguage } from "./languages";
import { DIET_TAGS, DIET_TYPES, SPICE_LEVELS } from "./types";
import type { DietTag, DietType, DishView, Prefs, SpiceLevel, WarningStatus } from "./types";

export type WarningReason =
  | { kind: "tag"; code: DietTag }
  | { kind: "allergen"; code: string }
  | { kind: "spice"; level: SpiceLevel; tolerance: SpiceLevel };

export interface WarningResult {
  status: WarningStatus;
  /** Why the status was given; empty for "ok". Avoid reasons come first. */
  reasons: WarningReason[];
  /** True when the dish data is unverified or incomplete (shown even when status is "avoid"). */
  unverified: boolean;
}

/** Tags avoided by each diet type (data-specification.md "Diet type expands automatically"). */
const DIET_TYPE_TAGS: Record<DietType, readonly DietTag[]> = {
  none: [],
  halal: ["pork", "alcohol"],
  vegetarian: ["pork", "beef", "chicken", "seafood"],
};

const MEAT_AND_SEAFOOD: readonly DietTag[] = DIET_TYPE_TAGS.vegetarian;

/** Tags a diet type implies. S4 uses this to auto-tick the checkboxes. */
export function expandDietType(dietType: DietType): DietTag[] {
  return [...(DIET_TYPE_TAGS[dietType] ?? [])];
}

/** All tags the student avoids: ticked ones plus those implied by the diet type. */
export function effectiveAvoidTags(prefs: Pick<Prefs, "avoidTags" | "dietType">): DietTag[] {
  return [...new Set([...prefs.avoidTags, ...expandDietType(prefs.dietType)])];
}

function isValidSpiceLevel(value: unknown): value is SpiceLevel {
  return (SPICE_LEVELS as readonly unknown[]).includes(value);
}

function isDietTag(value: unknown): value is DietTag {
  return (DIET_TAGS as readonly unknown[]).includes(value);
}

/** Preferences of a student who has set nothing yet (no personal warnings, any spice). */
export const DEFAULT_PREFS: Readonly<Prefs> = Object.freeze({
  lang: DEFAULT_LANGUAGE,
  avoidTags: [],
  avoidAllergens: [],
  spiceTolerance: 4,
  dietType: "none",
  onboarded: false,
});

/**
 * Turns whatever was read from localStorage into valid Prefs. Fails safe:
 * - nothing stored → DEFAULT_PREFS;
 * - a corrupt safety field → the strictest value (spice tolerance 0; an unknown diet
 *   type keeps every halal + vegetarian tag ticked) and `onboarded: false`, so the app
 *   asks the student to check "My diet" again. Never silently drops a warning.
 * `evaluate()` runs every prefs object through this, so UI code cannot bypass it.
 */
export function sanitizePrefs(raw: unknown): Prefs {
  if (raw === null || raw === undefined)
    return { ...DEFAULT_PREFS, avoidTags: [], avoidAllergens: [] };
  const r = (typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  let repaired = typeof raw !== "object";

  const avoidTags: DietTag[] = [];
  if (Array.isArray(r.avoidTags)) {
    for (const t of r.avoidTags) if (isDietTag(t)) avoidTags.push(t);
    if (avoidTags.length !== r.avoidTags.length) repaired = true;
  } else repaired = true;

  const avoidAllergens: string[] = [];
  if (Array.isArray(r.avoidAllergens)) {
    for (const a of r.avoidAllergens) if (typeof a === "string") avoidAllergens.push(a);
    if (avoidAllergens.length !== r.avoidAllergens.length) repaired = true;
  } else repaired = true;

  let spiceTolerance: SpiceLevel = 0;
  if (isValidSpiceLevel(r.spiceTolerance)) spiceTolerance = r.spiceTolerance;
  else repaired = true;

  let dietType: DietType = "none";
  const dt = typeof r.dietType === "string" ? r.dietType.trim().toLowerCase() : undefined;
  if (dt !== undefined && (DIET_TYPES as readonly string[]).includes(dt)) {
    dietType = dt as DietType;
    if (dt !== r.dietType) repaired = true;
  } else {
    repaired = true;
    avoidTags.push(...DIET_TYPE_TAGS.halal, ...DIET_TYPE_TAGS.vegetarian);
  }

  return {
    lang: typeof r.lang === "string" && isLanguage(r.lang) ? r.lang : DEFAULT_LANGUAGE,
    avoidTags: [...new Set(avoidTags)],
    avoidAllergens: [...new Set(avoidAllergens)],
    spiceTolerance,
    dietType,
    onboarded: r.onboarded === true && !repaired,
  };
}

/**
 * Allergen codes that prove a diet tag even if the tag is missing in the data
 * (MFDS list: 돼지고기, 쇠고기, 닭고기, shellfish and fish). Keep in sync with BE-06 codes.
 */
const ALLERGEN_IMPLIES_TAG: Readonly<Record<string, DietTag>> = {
  pork: "pork",
  beef: "beef",
  chicken: "chicken",
  shrimp: "seafood",
  crab: "seafood",
  shellfish: "seafood",
  squid: "seafood",
  mackerel: "seafood",
  oyster: "seafood",
  abalone: "seafood",
  mussel: "seafood",
};

/** Diet tags a dish is known to carry: stored tags plus tags implied by its allergens. */
function knownTags(dish: DishView): DietTag[] {
  const tags = new Set<DietTag>();
  for (const t of Array.isArray(dish.dietTags) ? dish.dietTags : []) if (isDietTag(t)) tags.add(t);
  for (const a of Array.isArray(dish.allergens) ? dish.allergens : []) {
    const implied = typeof a?.code === "string" ? ALLERGEN_IMPLIES_TAG[a.code] : undefined;
    if (implied) tags.add(implied);
  }
  return [...tags];
}

function isValidIsoDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * True when the dish data can be trusted for an "ok": allergens explicitly confirmed,
 * a valid verification date, a valid spice level and well-formed tag/allergen lists.
 */
export function isVerified(dish: DishView): boolean {
  return (
    dish.allergensConfirmed === true &&
    isValidIsoDate(dish.verifiedAt) &&
    isValidSpiceLevel(dish.spiceLevel) &&
    Array.isArray(dish.dietTags) &&
    Array.isArray(dish.allergens)
  );
}

/** Personal warning for one dish (BR6). Pure; safe to call on every render. */
export function evaluate(dish: DishView, rawPrefs: Prefs): WarningResult {
  const prefs = sanitizePrefs(rawPrefs);
  const unverified = !isVerified(dish);
  const avoidTags = new Set(effectiveAvoidTags(prefs));
  const avoidAllergens = new Set(prefs.avoidAllergens);

  const reasons: WarningReason[] = [];
  const seen = new Set<string>();

  for (const tag of knownTags(dish)) {
    if (avoidTags.has(tag)) {
      seen.add(tag);
      reasons.push({ kind: "tag", code: tag });
    }
  }
  for (const allergen of Array.isArray(dish.allergens) ? dish.allergens : []) {
    const code = allergen?.code;
    // A code may exist both as a diet tag and an allergen (e.g. pork); report it once.
    if (typeof code === "string" && avoidAllergens.has(code) && !seen.has(code)) {
      seen.add(code);
      reasons.push({ kind: "allergen", code });
    }
  }

  const spicy = isValidSpiceLevel(dish.spiceLevel) && dish.spiceLevel > prefs.spiceTolerance;
  if (spicy) {
    reasons.push({ kind: "spice", level: dish.spiceLevel, tolerance: prefs.spiceTolerance });
  }

  if (seen.size > 0) return { status: "avoid", reasons, unverified };
  if (unverified) return { status: "unverified", reasons, unverified };
  if (spicy) return { status: "caution", reasons, unverified };
  return { status: "ok", reasons: [], unverified };
}

export interface DietCompatibility {
  /** true = compatible, false = not compatible, null = unknown (unverified data). */
  halal: boolean | null;
  vegetarian: boolean | null;
}

/**
 * S3 "Diet info" (data-specification.md derived values halal_ok / vegetarian_ok).
 * A known violation is reported even on unverified data; a "✓" only on verified data.
 */
export function dietCompatibility(dish: DishView): DietCompatibility {
  const tags = new Set(knownTags(dish));
  const verified = isVerified(dish);
  const check = (forbidden: readonly DietTag[]): boolean | null => {
    if (forbidden.some((t) => tags.has(t))) return false;
    return verified ? true : null;
  };
  return { halal: check(DIET_TYPE_TAGS.halal), vegetarian: check(MEAT_AND_SEAFOOD) };
}

/** S2 order inside a corner (story 4.4). Unverified sits between caution and avoid. */
const STATUS_ORDER: Record<WarningStatus, number> = {
  ok: 0,
  caution: 1,
  unverified: 2,
  avoid: 3,
};

/**
 * Stable sort: OK → Caution → Not verified → Avoid. Returns a new array.
 * Calls evaluate() per item; for a corner of ~10 dishes the repeat call on each card is negligible.
 */
export function sortByStatus<T extends { dish: DishView }>(items: readonly T[], prefs: Prefs): T[] {
  return items
    .map((item, index) => ({ item, index, rank: STATUS_ORDER[evaluate(item.dish, prefs).status] }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

/** S2 quick filters (story 3.6). Session only; never stored. */
export interface MenuFilters {
  notSpicy: boolean;
  noPork: boolean;
  vegetarian: boolean;
}

export const NO_FILTERS: MenuFilters = { notSpicy: false, noPork: false, vegetarian: false };

/**
 * Keeps the items that satisfy every active filter. A filter is a positive claim
 * ("this has no pork"), so unverified dishes are hidden while any filter is on.
 */
export function applyFilters<T extends { dish: DishView }>(
  items: readonly T[],
  filters: MenuFilters,
): T[] {
  const active = filters.notSpicy || filters.noPork || filters.vegetarian;
  if (!active) return [...items];
  return items.filter(({ dish }) => {
    if (!isVerified(dish)) return false;
    if (filters.notSpicy && dish.spiceLevel !== 0) return false;
    const tags = knownTags(dish);
    if (filters.noPork && tags.includes("pork")) return false;
    if (filters.vegetarian && MEAT_AND_SEAFOOD.some((t) => tags.includes(t))) return false;
    return true;
  });
}
