// du-guards: data integrity rules for DU-Menu Scan (BE-05).
//  1. dish.diet_tags is derived from ingredient diet tags (BR5) and can never be written by hand.
//  2. A dish cannot be (or stay) published unless BR1 holds.
//  3. Composite uniqueness that Directus snapshots cannot express (D-020).
// Plain ESM, no build step. Reads and the derived write use the knex handle of the request
// (`database`), so they take part in its transaction and never re-trigger these hooks.

// Same shape as @directus/errors InvalidPayloadError (that package is not resolvable from an
// extension folder in the Directus image), so the API answers 400 INVALID_PAYLOAD, not 500.
class InvalidPayloadError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "DirectusError";
    this.code = "INVALID_PAYLOAD";
    this.status = 400;
    this.extensions = { reason };
  }
}
const reject = (reason) => {
  throw new InvalidPayloadError(reason);
};

const keysOf = (meta) => meta.keys ?? (meta.key !== undefined ? [meta.key] : []);
const has = (obj, k) => obj != null && Object.prototype.hasOwnProperty.call(obj, k);
const nonEmpty = (v) => typeof v === "string" && v.trim() !== "";
const dateKey = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

// ---------- 1. derived diet tags (BR5) ----------

async function recomputeDietTags(db, dishIds) {
  for (const dishId of new Set(dishIds.filter(Boolean))) {
    const rows = await db("dish_ingredient as di")
      .join("ingredient_diet_tag as t", "t.ingredient_id", "di.ingredient_id")
      .where("di.dish_id", dishId)
      .distinct("t.diet_tag_code");
    const tags = rows.map((r) => r.diet_tag_code).sort();
    await db("dish")
      .where({ id: dishId })
      .update({ diet_tags: JSON.stringify(tags) });
  }
}

async function dishIdsOfIngredients(db, ingredientIds) {
  if (!ingredientIds.length) return [];
  const rows = await db("dish_ingredient")
    .whereIn("ingredient_id", ingredientIds)
    .select("dish_id");
  return rows.map((r) => r.dish_id);
}

async function affectedDishes(db, collection, keys) {
  if (!keys.length) return [];
  if (collection === "dish_ingredient") {
    const rows = await db("dish_ingredient").whereIn("id", keys).select("dish_id");
    return rows.map((r) => r.dish_id);
  }
  const rows = await db("ingredient_diet_tag").whereIn("id", keys).select("ingredient_id");
  return dishIdsOfIngredients(
    db,
    rows.map((r) => r.ingredient_id),
  );
}

// ---------- 2. publish guard (BR1) ----------

function missingForPublish(dish, hasApprovedEn) {
  const missing = [];
  if (!nonEmpty(dish.name_ko)) missing.push("Korean name (name_ko)");
  if (!hasApprovedEn) {
    missing.push(
      "approved English translation (dish_translation lang=en, status=approved, name set)",
    );
  }
  const s = dish.spice_level;
  if (!Number.isInteger(s) || s < 0 || s > 4) missing.push("spice_level (0-4)");
  if (dish.allergens_confirmed !== true) missing.push("allergens_confirmed = true");
  return missing;
}

const nestedCreates = (v) => (Array.isArray(v) ? v : Array.isArray(v?.create) ? v.create : []);

async function hasApprovedEnglish(db, dishId) {
  const row = await db("dish_translation")
    .where({ dish_id: dishId, lang: "en", status: "approved" })
    .whereRaw("trim(coalesce(name, '')) <> ''")
    .first("id");
  return Boolean(row);
}

// The approved English translation of a published dish cannot be removed or weakened.
async function guardTranslationLoss(db, rows, change) {
  for (const row of rows) {
    if (row.lang !== "en" || row.status !== "approved") continue;
    const after = { ...row, ...change };
    const intact =
      after.lang === "en" &&
      after.status === "approved" &&
      nonEmpty(after.name) &&
      after.dish_id === row.dish_id;
    if (intact) continue;
    const dish = await db("dish").where({ id: row.dish_id }).first("status");
    if (dish?.status === "published") {
      reject(
        "The approved English translation of a published dish cannot be unapproved, emptied, changed or deleted. Unpublish the dish first.",
      );
    }
  }
}

// ---------- 3. uniqueness (D-020) ----------

const RULES = {
  daily_menu: {
    fields: ["cafeteria_id", "date", "meal"],
    message: "A daily menu already exists for this cafeteria, date and meal",
  },
  dish_translation: {
    fields: ["dish_id", "lang"],
    message: "This dish already has a translation for this language",
  },
  dish_ingredient: {
    fields: ["dish_id", "ingredient_id"],
    message: "This ingredient is already linked to this dish",
  },
  dish_allergen: {
    fields: ["dish_id", "allergen_code"],
    message: "This allergen is already linked to this dish",
  },
  ingredient_diet_tag: {
    fields: ["ingredient_id", "diet_tag_code"],
    message: "This diet tag is already linked to this ingredient",
  },
};

async function assertUnique(db, collection, existing, payload, keys) {
  const { fields, message } = RULES[collection];
  if (keys.length > 1 && fields.some((f) => has(payload, f))) {
    reject(`${message}: cannot set ${fields.join(", ")} on several items at once.`);
  }
  const merged = { ...(existing ?? {}), ...payload };
  // a missing required field is reported by Directus validation
  if (fields.some((f) => merged[f] === undefined || merged[f] === null)) return;
  const q = db(collection);
  for (const f of fields) q.where(f, f === "date" ? dateKey(merged[f]) : merged[f]);
  if (keys.length === 1) q.whereNot("id", keys[0]);
  if (await q.first("id")) {
    const shown = fields.map((f) => `${f}=${f === "date" ? dateKey(merged[f]) : merged[f]}`);
    reject(`${message} (${shown.join(", ")}).`);
  }
}

// ---------- 4. published menus only reference published dishes ----------

const todayKey = () => new Date().toISOString().slice(0, 10);

async function unpublishedDishesInMenu(db, menuId) {
  const rows = await db("menu_item as mi")
    .join("dish as d", "d.id", "mi.dish_id")
    .where("mi.daily_menu_id", menuId)
    .whereNot("d.status", "published")
    .distinct("d.id", "d.name_ko");
  return rows.map((r) => `${r.name_ko} (${r.id})`);
}

async function assertMenuItemAllowed(db, item) {
  if (!item.daily_menu_id || !item.dish_id) return;
  const menu = await db("daily_menu").where({ id: item.daily_menu_id }).first("status", "date");
  if (menu?.status !== "published") return;
  const dish = await db("dish").where({ id: item.dish_id }).first("status", "name_ko");
  if (dish && dish.status !== "published") {
    reject(
      `A published menu (${dateKey(menu.date)}) can only contain published dishes: ${dish.name_ko} (${item.dish_id}) is ${dish.status}.`,
    );
  }
}

async function assertDishNotLive(db, dishId) {
  const rows = await db("menu_item as mi")
    .join("daily_menu as dm", "dm.id", "mi.daily_menu_id")
    .where({ "mi.dish_id": dishId, "dm.status": "published" })
    .where("dm.date", ">=", todayKey())
    .select("dm.date")
    .orderBy("dm.date");
  if (rows.length) {
    const dates = [...new Set(rows.map((r) => dateKey(r.date)))].join(", ");
    reject(
      `Cannot unpublish dish ${dishId}: it is used by a published menu dated ${dates}. Remove it from the menu or unpublish the menu first.`,
    );
  }
}

// ---------- registration ----------

export default ({ filter, action }) => {
  // uniqueness
  for (const collection of Object.keys(RULES)) {
    filter(`${collection}.items.create`, async (payload, _meta, { database }) => {
      await assertUnique(database, collection, null, payload, []);
      return payload;
    });
    filter(`${collection}.items.update`, async (payload, meta, { database }) => {
      const keys = meta.keys ?? [];
      const existing =
        keys.length === 1 ? await database(collection).where({ id: keys[0] }).first() : null;
      await assertUnique(database, collection, existing, payload, keys);
      return payload;
    });
  }

  // diet_tags are never written by hand
  const noHandWrite = (payload) => {
    if (has(payload, "diet_tags")) {
      reject("dish.diet_tags is derived from ingredients and cannot be set directly.");
    }
  };

  // publish guard on dish
  filter("dish.items.create", async (payload) => {
    noHandWrite(payload);
    if (payload.status === "published") {
      // translations created in the same request are not in the database yet
      const en = nestedCreates(payload.translations).some(
        (t) => t.lang === "en" && t.status === "approved" && nonEmpty(t.name),
      );
      const missing = missingForPublish(payload, en);
      if (missing.length) reject(`Cannot publish dish. Missing: ${missing.join("; ")}.`);
    }
    return payload;
  });
  filter("dish.items.update", async (payload, meta, { database }) => {
    noHandWrite(payload);
    for (const key of meta.keys ?? []) {
      const existing = await database("dish").where({ id: key }).first();
      if (!existing) continue;
      const merged = { ...existing, ...payload };
      if (existing.status === "published" && merged.status !== "published") {
        await assertDishNotLive(database, key);
      }
      if (merged.status !== "published") continue;
      const missing = missingForPublish(merged, await hasApprovedEnglish(database, key));
      if (missing.length) reject(`Cannot publish dish ${key}. Missing: ${missing.join("; ")}.`);
    }
    return payload;
  });

  // published menus only reference published dishes
  filter("daily_menu.items.create", async (payload, _meta, { database }) => {
    if (payload.status === "published") {
      for (const it of nestedCreates(payload.items)) {
        if (it.dish_id) {
          const d = await database("dish").where({ id: it.dish_id }).first("status", "name_ko");
          if (d && d.status !== "published") {
            reject(
              `A published menu can only contain published dishes: ${d.name_ko} (${it.dish_id}) is ${d.status}.`,
            );
          }
        }
      }
    }
    return payload;
  });
  filter("daily_menu.items.update", async (payload, meta, { database }) => {
    if (payload.status === "published") {
      for (const key of meta.keys ?? []) {
        const bad = await unpublishedDishesInMenu(database, key);
        if (bad.length) {
          reject(`Cannot publish menu ${key}: it contains unpublished dishes: ${bad.join(", ")}.`);
        }
      }
    }
    return payload;
  });
  filter("menu_item.items.create", async (payload, _meta, { database }) => {
    await assertMenuItemAllowed(database, payload);
    return payload;
  });
  filter("menu_item.items.update", async (payload, meta, { database }) => {
    for (const key of meta.keys ?? []) {
      const existing = await database("menu_item").where({ id: key }).first();
      if (existing) await assertMenuItemAllowed(database, { ...existing, ...payload });
    }
    return payload;
  });

  filter("dish_translation.items.update", async (payload, meta, { database }) => {
    const rows = await database("dish_translation").whereIn("id", meta.keys ?? []);
    await guardTranslationLoss(database, rows, payload);
    return payload;
  });
  filter("dish_translation.items.delete", async (keys, meta, { database }) => {
    const rows = await database("dish_translation").whereIn("id", meta.keys ?? keys);
    await guardTranslationLoss(database, rows, { status: "deleted" });
    return keys;
  });

  // derived diet tags: remember which dishes a change touches before it happens ...
  const before = new Map();
  const memo = (collection, keys) => `${collection}:${[...keys].sort().join(",")}`;
  for (const collection of ["dish_ingredient", "ingredient_diet_tag"]) {
    for (const op of ["update", "delete"]) {
      filter(`${collection}.items.${op}`, async (payload, meta, { database }) => {
        const keys = meta.keys ?? (Array.isArray(payload) ? payload : []);
        before.set(memo(collection, keys), await affectedDishes(database, collection, keys));
        return payload;
      });
    }
    // ... and recompute them afterwards
    for (const op of ["create", "update", "delete"]) {
      action(`${collection}.items.${op}`, async (meta, { database }) => {
        const keys = keysOf(meta);
        const key = memo(collection, keys);
        const prior = before.get(key) ?? [];
        before.delete(key);
        const now = op === "delete" ? [] : await affectedDishes(database, collection, keys);
        await recomputeDietTags(database, [...prior, ...now]);
      });
    }
  }
};
