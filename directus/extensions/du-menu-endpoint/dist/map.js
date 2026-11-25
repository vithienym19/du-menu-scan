// Pure mapping from database rows to the MenuView shape of packages/shared/src/types.ts.
// No I/O here, so it is unit-tested in directus/test/today-menu.test.mjs.
// Safety (BR3/BR6): missing data stays missing. Nothing is upgraded to "verified" or "confirmed".

export const DIET_TAGS = ["pork", "beef", "chicken", "seafood", "alcohol"];

const str = (v) => (typeof v === "string" ? v.trim() : "");

/** Accepts a JSON object or a JSON string; returns {} for anything else. */
function parseJson(v) {
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return {};
    }
  }
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function parseTags(v) {
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
}

/** LocalizedText: Korean source plus any non-empty extra language (BR2 fallback is done by the client). */
export function localized(ko, extra) {
  const out = { ko: str(ko) };
  for (const [lang, value] of Object.entries(parseJson(extra))) {
    const text = str(value);
    if (lang !== "ko" && text) out[lang] = text;
  }
  return out;
}

export const dateKey = (v) =>
  v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10);

const bySort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.id).localeCompare(String(b.id));
const groupBy = (rows, key) => {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r[key])) map.set(r[key], []);
    map.get(r[key]).push(r);
  }
  return map;
};

export function toCafeteriaView(c) {
  const hours = parseJson(c.opening_hours);
  const openingHours = {};
  if (str(hours.lunch)) openingHours.lunch = str(hours.lunch);
  if (str(hours.dinner)) openingHours.dinner = str(hours.dinner);
  return { id: c.id, code: c.code, name: localized(c.name_ko, c.names), openingHours };
}

/**
 * Rows are pre-filtered by the endpoint (published dishes, approved translations); the mapper
 * filters again on the same flags, so a mistake in one place cannot leak a draft.
 */
export function toDishView(dish, rel) {
  const name = { ko: str(dish.name_ko) };
  const description = {};
  const descKo = str(dish.description_ko);
  if (descKo) description.ko = descKo;
  for (const t of rel.translations ?? []) {
    if (t.dish_id !== dish.id || t.status !== "approved") continue;
    if (!t.lang || t.lang === "ko") continue;
    if (str(t.name)) name[t.lang] = str(t.name);
    if (str(t.description)) description[t.lang] = str(t.description);
  }

  const ingredientsById = new Map((rel.ingredients ?? []).map((i) => [i.id, i]));
  const ingredientTags = groupBy(rel.ingredientTags ?? [], "ingredient_id");
  const tags = new Set();
  const ingredients = [];
  for (const l of (rel.dishIngredients ?? []).filter((x) => x.dish_id === dish.id)) {
    const ing = ingredientsById.get(l.ingredient_id);
    if (!ing) continue;
    ingredients.push({
      name: localized(ing.name_ko, ing.names),
      isMain: l.is_main === true,
      isHidden: l.is_hidden === true,
    });
    for (const t of ingredientTags.get(l.ingredient_id) ?? []) tags.add(t.diet_tag_code);
  }
  // Stored (hook-derived) tags are merged in: a stale value can only add a warning, never remove one.
  for (const t of parseTags(dish.diet_tags)) tags.add(t);

  const allergensByCode = new Map((rel.allergens ?? []).map((a) => [a.code, a]));
  const allergens = [];
  for (const l of (rel.dishAllergens ?? []).filter((x) => x.dish_id === dish.id)) {
    const a = allergensByCode.get(l.allergen_code);
    if (a) allergens.push({ code: a.code, name: localized(a.name_ko, a.names) });
  }

  const view = {
    id: dish.id,
    name,
    photoUrl: null, // public role has no access to directus_files yet (see directus/README.md)
    // Unknown spice must fail towards the strict side (BR6): treat it as the hottest level.
    spiceLevel: Number.isInteger(dish.spice_level) ? dish.spice_level : 4,
    ingredients,
    allergens,
    dietTags: DIET_TAGS.filter((t) => tags.has(t)),
    allergensConfirmed: dish.allergens_confirmed === true,
    verifiedAt: dateKey(dish.verified_at),
  };
  if (Object.keys(description).length) view.description = description;
  return view;
}

/**
 * input: { cafeteria, date, meal, menu|null, corners[], items[], dishes[], relations{} }
 * Without a published menu, or when no published dish is left, status is "empty" and corners [].
 */
export function toMenuView({ cafeteria, date, meal, menu, corners, items, dishes, relations }) {
  const base = { cafeteria: toCafeteriaView(cafeteria), date, meal };
  if (!menu || menu.status !== "published") return { ...base, status: "empty", corners: [] };

  const dishById = new Map(dishes.filter((d) => d.status === "published").map((d) => [d.id, d]));
  const itemsByCorner = groupBy(
    items.filter((i) => i.daily_menu_id === menu.id && dishById.has(i.dish_id)),
    "corner_id",
  );
  const out = [];
  for (const corner of [...corners].sort(bySort)) {
    const rows = [...(itemsByCorner.get(corner.id) ?? [])].sort(bySort);
    if (!rows.length) continue;
    out.push({
      id: corner.id,
      name: localized(corner.name_ko, corner.names),
      items: rows.map((r) => ({
        dish: toDishView(dishById.get(r.dish_id), relations),
        price: Number.isInteger(r.price) ? r.price : null,
      })),
    });
  }
  return { ...base, status: out.length ? "published" : "empty", corners: out };
}
