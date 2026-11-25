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
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4;
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
export function evaluate(dish: DishView, prefs: Prefs): WarningResult {
  const unverified = !isVerified(dish);
  const avoidTags = new Set(effectiveAvoidTags(prefs));
  const avoidAllergens = new Set(prefs.avoidAllergens);

  const reasons: WarningReason[] = [];
  const seen = new Set<string>();

  for (const tag of Array.isArray(dish.dietTags) ? dish.dietTags : []) {
    if (avoidTags.has(tag) && !seen.has(tag)) {
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

  const spicy =
    isValidSpiceLevel(dish.spiceLevel) &&
    isValidSpiceLevel(prefs.spiceTolerance) &&
    dish.spiceLevel > prefs.spiceTolerance;
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
  const tags = new Set(Array.isArray(dish.dietTags) ? dish.dietTags : []);
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

/** Stable sort: OK → Caution → Not verified → Avoid. Returns a new array. */
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
    if (filters.noPork && dish.dietTags.includes("pork")) return false;
    if (filters.vegetarian && MEAT_AND_SEAFOOD.some((t) => dish.dietTags.includes(t))) return false;
    return true;
  });
}
