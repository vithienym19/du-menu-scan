// Idempotent import of the reference data in directus/seed/*.csv into a running Directus:
// allergen (by code), diet_tag (by code), ingredient (by name_ko), ingredient_diet_tag pairs.
// Existing rows are updated when the CSV differs; pairs no longer in the CSV are removed for
// seeded ingredients. Nothing outside the CSV rows is touched (no ingredient is deleted).
//
// Usage: DIRECTUS_URL=http://localhost:8055 DIRECTUS_TOKEN=<admin static token> node directus/scripts/import-seed.mjs
//    or: DIRECTUS_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=...  node directus/scripts/import-seed.mjs

import { loadAllergens, loadDietTags, loadIngredients } from "./seed-lib.mjs";

const BASE = (process.env.DIRECTUS_URL ?? `http://localhost:${process.env.DIRECTUS_PORT ?? 8055}`).replace(/\/$/, "");
let token = process.env.DIRECTUS_TOKEN;

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return text ? JSON.parse(text).data : null;
}

async function login() {
  if (token) return;
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    throw new Error("Set DIRECTUS_TOKEN, or ADMIN_EMAIL and ADMIN_PASSWORD");
  }
  token = (await api("POST", "/auth/login", { email, password })).access_token;
}

const stable = (v) =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === "object" && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)))
      : x,
  );

const stats = {};
const bump = (key, what) => {
  stats[key] ??= { created: 0, updated: 0, unchanged: 0, deleted: 0 };
  stats[key][what]++;
};

async function upsertByKey(collection, keyField, rows, fields, pk = "id") {
  const cols = [...new Set([pk, keyField, ...fields])];
  const existing = await api("GET", `/items/${collection}?limit=-1&fields=${cols.join(",")}`);
  const byKey = new Map();
  for (const e of existing) {
    if (byKey.has(e[keyField])) {
      throw new Error(`${collection}: duplicate ${keyField} "${e[keyField]}" in database`);
    }
    byKey.set(e[keyField], e);
  }
  const result = new Map();
  for (const row of rows) {
    const found = byKey.get(row[keyField]);
    if (!found) {
      const created = await api("POST", `/items/${collection}`, row);
      result.set(row[keyField], created);
      bump(collection, "created");
    } else if (fields.some((f) => stable(found[f]) !== stable(row[f]))) {
      const patch = Object.fromEntries(fields.map((f) => [f, row[f]]));
      await api("PATCH", `/items/${collection}/${encodeURIComponent(found[pk])}`, patch);
      result.set(row[keyField], { ...found, ...patch });
      bump(collection, "updated");
    } else {
      result.set(row[keyField], found);
      bump(collection, "unchanged");
    }
  }
  return result;
}

await login();

const dietTags = loadDietTags();
const dietCodes = new Set(dietTags.map((t) => t.code));
const ingredients = loadIngredients();
for (const ing of ingredients) {
  for (const code of ing.diet_tags) {
    if (!dietCodes.has(code))
      throw new Error(`ingredient ${ing.name_ko}: unknown diet tag "${code}"`);
  }
}

await upsertByKey("allergen", "code", loadAllergens(), ["name_ko", "names"], "code");
await upsertByKey("diet_tag", "code", dietTags, [], "code");
const saved = await upsertByKey(
  "ingredient",
  "name_ko",
  ingredients.map(({ name_ko, names }) => ({ name_ko, names })),
  ["names"],
);

const pairs = await api(
  "GET",
  "/items/ingredient_diet_tag?limit=-1&fields=id,ingredient_id,diet_tag_code",
);
const pairsByIngredient = new Map();
for (const p of pairs) {
  if (!pairsByIngredient.has(p.ingredient_id)) pairsByIngredient.set(p.ingredient_id, []);
  pairsByIngredient.get(p.ingredient_id).push(p);
}
for (const ing of ingredients) {
  const id = saved.get(ing.name_ko).id;
  const want = new Set(ing.diet_tags);
  const seen = new Set();
  for (const p of pairsByIngredient.get(id) ?? []) {
    if (!want.has(p.diet_tag_code) || seen.has(p.diet_tag_code)) {
      await api("DELETE", `/items/ingredient_diet_tag/${p.id}`);
      bump("ingredient_diet_tag", "deleted");
    } else {
      seen.add(p.diet_tag_code);
      bump("ingredient_diet_tag", "unchanged");
    }
  }
  for (const code of want) {
    if (seen.has(code)) continue;
    await api("POST", "/items/ingredient_diet_tag", { ingredient_id: id, diet_tag_code: code });
    bump("ingredient_diet_tag", "created");
  }
}

for (const c of ["allergen", "diet_tag", "ingredient", "ingredient_diet_tag"]) {
  const total = await api("GET", `/items/${c}?aggregate[count]=*`);
  console.log(`${c}: ${JSON.stringify(stats[c] ?? {})} total=${total[0].count}`);
}
