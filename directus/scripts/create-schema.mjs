// Creates the DU-Menu Scan collections, fields and relations (product/data-specification.md)
// on an EMPTY Directus via the REST API. Not idempotent: for an existing database use
// `npm run backend:schema:apply` (snapshot) instead.
//
// Usage: DIRECTUS_URL=http://localhost:8055 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//          node directus/scripts/create-schema.mjs
// After running, export the snapshot: npm run backend:schema:snapshot

import { readFileSync } from "node:fs";

const URL_BASE = (process.env.DIRECTUS_URL ?? "http://localhost:8055").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

const languages = JSON.parse(
  readFileSync(new URL("../../packages/shared/src/languages.json", import.meta.url), "utf8"),
);
const TRANSLATION_LANGS = languages.map((l) => l.code).filter((c) => c !== "ko");

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

// ---- field helpers ----
const uuidPk = () => ({
  field: "id",
  type: "uuid",
  meta: { special: ["uuid"], interface: "input", readonly: true, hidden: true },
  schema: { is_primary_key: true, has_auto_increment: false },
});
const intPk = (type = "integer") => ({
  field: "id",
  type,
  meta: { interface: "input", readonly: true, hidden: true },
  schema: { is_primary_key: true, has_auto_increment: true },
});
const stringPk = (field) => ({
  field,
  type: "string",
  meta: { interface: "input", required: true },
  schema: { is_primary_key: true, is_nullable: false },
});
const str = (field, { required = false, unique = false } = {}) => ({
  field,
  type: "string",
  meta: { interface: "input", required },
  schema: { is_nullable: !required, is_unique: unique },
});
const text = (field) => ({
  field,
  type: "text",
  meta: { interface: "input-multiline" },
  schema: {},
});
const json = (field) => ({
  field,
  type: "json",
  meta: { interface: "input-code", special: ["cast-json"], options: { language: "json" } },
  schema: {},
});
const bool = (field, def) => ({
  field,
  type: "boolean",
  meta: { interface: "boolean", special: ["cast-boolean"] },
  schema: { default_value: def, is_nullable: false },
});
const int = (field, { required = false, min, max } = {}) => {
  const rules = [];
  if (min !== undefined) rules.push({ [field]: { _gte: min } });
  if (max !== undefined) rules.push({ [field]: { _lte: max } });
  return {
    field,
    type: "integer",
    meta: {
      interface: "input",
      required,
      ...(rules.length
        ? { validation: { _and: rules }, validation_message: `${field} must be ${min}..${max}` }
        : {}),
    },
    schema: { is_nullable: !required },
  };
};
const date = (field, required = false) => ({
  field,
  type: "date",
  meta: { interface: "datetime", required },
  schema: { is_nullable: !required },
});
const enumField = (field, values, { def, required = false } = {}) => ({
  field,
  type: "string",
  meta: {
    interface: "select-dropdown",
    required,
    options: { choices: values.map((v) => ({ text: v, value: v })) },
    validation: { _and: [{ [field]: { _in: values } }] },
    validation_message: `${field} must be one of: ${values.join(", ")}`,
  },
  schema: { is_nullable: !required, ...(def !== undefined ? { default_value: def } : {}) },
});
// foreign-key column; the relation itself is declared in RELATIONS
const fk = (field, type = "uuid") => ({
  field,
  type,
  meta: { interface: "select-dropdown-m2o", special: ["m2o"], required: true },
  schema: { is_nullable: false },
});

// ---- collections (parents before children) ----
const COLLECTIONS = [
  {
    collection: "cafeteria",
    note: "Cafeteria; code is used in the QR URL /r/{code}",
    fields: [
      uuidPk(),
      str("code", { required: true, unique: true }),
      str("name_ko", { required: true }),
      json("names"),
      json("opening_hours"),
      bool("is_active", true),
    ],
  },
  {
    collection: "corner",
    fields: [
      uuidPk(),
      fk("cafeteria_id"),
      str("name_ko", { required: true }),
      json("names"),
      int("sort"),
    ],
  },
  {
    collection: "dish",
    note: "Dish dictionary",
    fields: [
      uuidPk(),
      str("name_ko", { required: true }),
      text("description_ko"),
      {
        field: "photo",
        type: "uuid",
        meta: { interface: "file-image", special: ["file"] },
        schema: {},
      },
      int("spice_level", { required: true, min: 0, max: 4 }),
      bool("allergens_confirmed", false),
      str("verified_by"),
      date("verified_at"),
      enumField("status", ["draft", "published"], { def: "draft", required: true }),
      {
        // Derived by the du-guards hook (BR5); never edited by hand.
        field: "diet_tags",
        type: "json",
        meta: {
          interface: "input-code",
          special: ["cast-json"],
          options: { language: "json" },
          readonly: true,
          note: "Derived from ingredients — do not edit",
        },
        schema: { default_value: "[]" },
      },
    ],
  },
  {
    collection: "dish_translation",
    fields: [
      intPk(),
      fk("dish_id"),
      enumField("lang", TRANSLATION_LANGS, { required: true }),
      str("name", { required: true }),
      text("description"),
      enumField("source", ["ai", "human"], { required: true }),
      enumField("status", ["draft", "approved"], { def: "draft", required: true }),
    ],
  },
  {
    collection: "ingredient",
    fields: [uuidPk(), str("name_ko", { required: true }), json("names")],
  },
  {
    collection: "allergen",
    fields: [stringPk("code"), str("name_ko", { required: true }), json("names")],
  },
  {
    collection: "diet_tag",
    note: "Codes: pork, beef, chicken, seafood, alcohol",
    fields: [stringPk("code")],
  },
  {
    collection: "dish_ingredient",
    fields: [
      intPk(),
      fk("dish_id"),
      fk("ingredient_id"),
      bool("is_main", false),
      bool("is_hidden", false),
    ],
  },
  { collection: "dish_allergen", fields: [intPk(), fk("dish_id"), fk("allergen_code", "string")] },
  {
    collection: "ingredient_diet_tag",
    fields: [intPk(), fk("ingredient_id"), fk("diet_tag_code", "string")],
  },
  {
    collection: "daily_menu",
    fields: [
      uuidPk(),
      fk("cafeteria_id"),
      date("date", true),
      enumField("meal", ["lunch", "dinner"], { required: true }),
      enumField("status", ["draft", "published"], { def: "draft", required: true }),
    ],
  },
  {
    collection: "menu_item",
    fields: [
      intPk(),
      fk("daily_menu_id"),
      fk("corner_id"),
      fk("dish_id"),
      int("price"),
      int("sort"),
    ],
  },
  {
    collection: "scan_event",
    note: "Analytics, no personal data (BR8)",
    fields: [
      intPk("bigInteger"),
      fk("cafeteria_id"),
      {
        field: "created_at",
        type: "timestamp",
        meta: { interface: "datetime", special: ["date-created"], readonly: true },
        schema: { default_value: "CURRENT_TIMESTAMP", is_nullable: false },
      },
      str("lang", { required: true }),
      enumField("entry", ["qr", "direct"], { required: true }),
    ],
  },
];

// ---- relations: many.field -> one (+ optional O2M alias on the one side) ----
// CASCADE for junction rows owned by dish/ingredient/menu; RESTRICT elsewhere, so a dish,
// corner, allergen, diet tag or cafeteria that is still referenced cannot be deleted.
const R = (many, field, one, onDelete, alias, sort) => ({
  many,
  field,
  one,
  onDelete,
  alias,
  sort,
});
const RELATIONS = [
  R("corner", "cafeteria_id", "cafeteria", "RESTRICT", "corners", "sort"),
  R("dish_translation", "dish_id", "dish", "CASCADE", "translations"),
  R("dish_ingredient", "dish_id", "dish", "CASCADE", "ingredients"),
  R("dish_ingredient", "ingredient_id", "ingredient", "RESTRICT"),
  R("dish_allergen", "dish_id", "dish", "CASCADE", "allergens"),
  R("dish_allergen", "allergen_code", "allergen", "RESTRICT"),
  R("ingredient_diet_tag", "ingredient_id", "ingredient", "CASCADE", "diet_tags"),
  R("ingredient_diet_tag", "diet_tag_code", "diet_tag", "RESTRICT"),
  R("daily_menu", "cafeteria_id", "cafeteria", "RESTRICT"),
  R("menu_item", "daily_menu_id", "daily_menu", "CASCADE", "items", "sort"),
  R("menu_item", "corner_id", "corner", "RESTRICT"),
  R("menu_item", "dish_id", "dish", "RESTRICT"),
  R("scan_event", "cafeteria_id", "cafeteria", "RESTRICT"),
];

async function main() {
  const login = await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  token = login.access_token;

  for (const c of COLLECTIONS) {
    await api("POST", "/collections", {
      collection: c.collection,
      meta: { note: c.note ?? null, icon: "box" },
      schema: {},
      fields: c.fields,
    });
    console.log(`collection ${c.collection}`);
  }

  // dish.photo -> directus_files
  await api("POST", "/relations", {
    collection: "dish",
    field: "photo",
    related_collection: "directus_files",
    schema: { on_delete: "SET NULL" },
  });

  for (const r of RELATIONS) {
    await api("POST", "/relations", {
      collection: r.many,
      field: r.field,
      related_collection: r.one,
      meta: { one_field: r.alias ?? null, sort_field: r.sort ?? null },
      schema: { on_delete: r.onDelete },
    });
    if (r.alias) {
      await api("POST", `/fields/${r.one}`, {
        field: r.alias,
        type: "alias",
        meta: { interface: "list-o2m", special: ["o2m"] },
      });
    }
    console.log(
      `relation ${r.many}.${r.field} -> ${r.one} (${r.onDelete})${r.alias ? ` alias ${r.one}.${r.alias}` : ""}`,
    );
  }
  console.log("done");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
