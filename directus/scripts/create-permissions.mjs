// Creates/updates roles, policies and permissions (product/technical-architecture.md §3, BR7, BR8)
// through the Directus REST API. Idempotent: safe to run any number of times. The permission
// rows of the three managed policies (Public, Staff, Reviewer) are replaced by the definitions
// below, so manual edits to those policies are overwritten. Admin is the built-in Administrator
// role and is not touched. Users are not created here (create them in the admin UI).
//
// Usage: DIRECTUS_URL=http://localhost:8055 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//          node directus/scripts/create-permissions.mjs
// Order: schema apply -> create-permissions -> seed (collections must exist first).

const URL_BASE = (
  process.env.DIRECTUS_URL ?? `http://localhost:${process.env.DIRECTUS_PORT ?? 8055}`
).replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

import { readFileSync } from "node:fs";

const LANG_CODES = JSON.parse(
  readFileSync(new URL("../../packages/shared/src/languages.json", import.meta.url), "utf8"),
).map((l) => l.code);

let token;
async function api(method, path, body) {
  const res = await fetch(`${URL_BASE}${path}`, {
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

// ---- filters ----
const eq = (field, value) => ({ [field]: { _eq: value } });
const dishPublished = { dish_id: eq("status", "published") };

// permission helper: p(collection, action, { permissions, validation, fields })
const p = (collection, action, { permissions = null, validation = null, fields = ["*"] } = {}) => ({
  collection,
  action,
  permissions,
  validation,
  fields,
});

// ---- Public (anonymous): read published data, create scan_event only ----
const PUBLIC = [
  p("cafeteria", "read", { permissions: eq("is_active", true) }),
  p("corner", "read", { permissions: { cafeteria_id: eq("is_active", true) } }),
  p("daily_menu", "read", { permissions: eq("status", "published") }),
  p("menu_item", "read", {
    permissions: {
      _and: [{ daily_menu_id: eq("status", "published") }, { dish_id: eq("status", "published") }],
    },
  }),
  p("dish", "read", { permissions: eq("status", "published") }),
  p("dish_translation", "read", {
    permissions: { _and: [eq("status", "approved"), dishPublished] },
  }),
  p("dish_ingredient", "read", { permissions: dishPublished }),
  p("dish_allergen", "read", { permissions: dishPublished }),
  // reference vocabulary: all rows
  p("ingredient", "read"),
  p("ingredient_diet_tag", "read"),
  p("allergen", "read"),
  p("diet_tag", "read"),
  // BR8: write-only analytics; no read/update/delete
  p("scan_event", "create", {
    fields: ["cafeteria_id", "lang", "entry"],
    validation: {
      _and: [{ lang: { _in: LANG_CODES } }, { entry: { _in: ["qr", "direct"] } }],
    },
  }),
  // directus_files: intentionally NOT granted (see directus/README.md, open question)
];

// ---- Staff: menus and dishes. No delete on daily_menu, dish, ingredient, allergen. ----
const STAFF = [
  p("cafeteria", "read"),
  p("corner", "create"),
  p("corner", "read"),
  p("corner", "update"),
  p("daily_menu", "create"),
  p("daily_menu", "read"),
  p("daily_menu", "update"),
  p("menu_item", "create"),
  p("menu_item", "read"),
  p("menu_item", "update"),
  p("menu_item", "delete"),
  p("dish", "create"),
  p("dish", "read"),
  p("dish", "update"),
  p("dish_ingredient", "create"),
  p("dish_ingredient", "read"),
  p("dish_ingredient", "update"),
  p("dish_ingredient", "delete"), // junction rows: needed to correct a recipe
  p("dish_allergen", "create"),
  p("dish_allergen", "read"),
  p("dish_allergen", "update"),
  p("dish_allergen", "delete"),
  p("ingredient", "create"),
  p("ingredient", "read"),
  p("ingredient", "update"),
  p("ingredient_diet_tag", "create"),
  p("ingredient_diet_tag", "read"),
  p("ingredient_diet_tag", "update"),
  p("ingredient_diet_tag", "delete"),
  // translations: staff can only add drafts and edit drafts; approval is the Reviewer's job
  p("dish_translation", "create", { validation: eq("status", "draft") }),
  p("dish_translation", "read"),
  p("dish_translation", "update", {
    permissions: eq("status", "draft"),
    validation: eq("status", "draft"),
    fields: ["name", "description", "lang"],
  }),
  // read-only vocabularies
  p("allergen", "read"),
  p("diet_tag", "read"),
  p("scan_event", "read"),
  // dish photos
  p("directus_files", "create"),
  p("directus_files", "read"),
  p("directus_files", "update"),
];

// ---- Reviewer: translations only ----
const REVIEWER = [
  p("dish", "read"),
  p("dish_translation", "read"),
  p("dish_translation", "update", { fields: ["name", "description", "status"] }),
];

const MANAGED = [
  { name: "Staff", description: "Cafeteria staff: menus and dishes", app: true, rules: STAFF },
  { name: "Reviewer", description: "Translation reviewer", app: true, rules: REVIEWER },
];

async function findOrCreate(path, name, create) {
  const found = await api("GET", `${path}?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`);
  if (found.length) return found[0];
  return api("POST", path, create);
}

// Create the new rows first, then delete the old ones: never a moment with zero permissions.
async function replacePermissions(policy, rules, label) {
  const old = await api("GET", `/permissions?filter[policy][_eq]=${policy}&limit=-1&fields=id`);
  await api(
    "POST",
    "/permissions",
    rules.map((r) => ({ ...r, policy })),
  );
  if (old.length)
    await api(
      "DELETE",
      "/permissions",
      old.map((o) => o.id),
    );
  console.log(`${label}: ${rules.length} permissions`);
}

async function main() {
  const login = await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  token = login.access_token;

  // Public policy = policy attached to no role and no user
  const publicAccess = await api(
    "GET",
    "/access?filter[role][_null]=true&filter[user][_null]=true&limit=2",
  );
  if (publicAccess.length !== 1)
    throw new Error(`Expected exactly 1 Public policy, found ${publicAccess.length}`);
  await replacePermissions(publicAccess[0].policy, PUBLIC, "Public");

  for (const m of MANAGED) {
    const policy = await findOrCreate("/policies", m.name, {
      name: m.name,
      description: m.description,
      icon: "badge",
      admin_access: false,
      app_access: m.app,
      enforce_tfa: false,
    });
    // keep flags in sync on re-run
    await api("PATCH", `/policies/${policy.id}`, { admin_access: false, app_access: m.app });
    const role = await findOrCreate("/roles", m.name, { name: m.name });
    const link = await api(
      "GET",
      `/access?filter[role][_eq]=${role.id}&filter[policy][_eq]=${policy.id}&limit=1`,
    );
    if (!link.length) await api("POST", "/access", { role: role.id, policy: policy.id });
    await replacePermissions(policy.id, m.rules, m.name);
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
