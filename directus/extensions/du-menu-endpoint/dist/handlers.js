// du-menu-endpoint handlers (BE-11, BE-20): today menu, cafeterias, dish detail.
// Pre-shaped views for S1-S3. Reads with the raw knex handle, so Directus
// permissions do NOT apply: every query below filters explicitly on is_active, status=published
// (menus, dishes) and status=approved (translations). Never remove those filters.
import { toCafeteriaView, toDishView, toMenuView } from "./map.js";

const TIME_ZONE = process.env.MENU_TIMEZONE || "Asia/Seoul";
const MEALS = ["lunch", "dinner"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Errors must never be cached: a 404 for a dish or cafeteria published a minute later would stick.
const fail = (res, status, code, message) =>
  res
    .set("Cache-Control", "no-store")
    .status(status)
    .json({ errors: [{ message, extensions: { code } }] });

function validDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Today's date and hour in the cafeteria's time zone (a scan at 08:00 KST is still the previous UTC day). */
function now(zone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

const DISH_COLUMNS = [
  "id",
  "name_ko",
  "description_ko",
  "spice_level",
  "allergens_confirmed",
  "verified_at",
  "diet_tags",
  "status",
];

/** Everything toDishView needs for the given (already published) dish ids. Approved translations only. */
async function loadRelations(db, ids) {
  const dishIngredients = ids.length
    ? await db("dish_ingredient")
        .whereIn("dish_id", ids)
        .select("dish_id", "ingredient_id", "is_main", "is_hidden")
    : [];
  const ingredientIds = [...new Set(dishIngredients.map((l) => l.ingredient_id))];
  return {
    dishIngredients,
    translations: ids.length
      ? await db("dish_translation")
          .whereIn("dish_id", ids)
          .andWhere({ status: "approved" })
          .select("dish_id", "lang", "name", "description", "status")
      : [],
    ingredients: ingredientIds.length
      ? await db("ingredient").whereIn("id", ingredientIds).select("id", "name_ko", "names")
      : [],
    ingredientTags: ingredientIds.length
      ? await db("ingredient_diet_tag")
          .whereIn("ingredient_id", ingredientIds)
          .select("ingredient_id", "diet_tag_code")
      : [],
    dishAllergens: ids.length
      ? await db("dish_allergen").whereIn("dish_id", ids).select("dish_id", "allergen_code")
      : [],
    allergens: await db("allergen").select("code", "name_ko", "names"),
  };
}

/** Wraps an async handler: any unexpected error becomes a generic 500 (no internals leaked). */
const safe = (what, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error("du-menu-endpoint failed", err);
    fail(res, 500, "INTERNAL_ERROR", `Could not load the ${what}`);
  }
};

/** Builds the route handlers around a knex handle; `clock` is injectable for tests. */
export function createHandlers(db, clock = () => now(TIME_ZONE)) {
  const todayMenu = safe("menu", async (req, res) => {
    const code = String(req.params.code);
    const time = clock();
    const date = req.query.date === undefined ? time.date : String(req.query.date);
    if (!validDate(date)) return fail(res, 400, "INVALID_DATE", "date must be YYYY-MM-DD");
    const meal = req.query.meal === undefined ? null : String(req.query.meal);
    if (meal !== null && !MEALS.includes(meal))
      return fail(res, 400, "INVALID_MEAL", "meal must be lunch or dinner");

    const cafeteria = await db("cafeteria").where({ code, is_active: true }).first();
    if (!cafeteria) return fail(res, 404, "CAFETERIA_NOT_FOUND", "Cafeteria not found");

    const menus = await db("daily_menu")
      .where({ cafeteria_id: cafeteria.id, status: "published" })
      .andWhere("date", date);
    // Default meal: lunch until 15:00 local time, dinner after; fall back to the other one.
    const wanted = meal ?? (time.hour < 15 ? "lunch" : "dinner");
    const menu =
      menus.find((m) => m.meal === wanted) ??
      (meal ? null : (menus.find((m) => MEALS.includes(m.meal)) ?? null));

    const input = {
      cafeteria,
      date,
      meal: menu?.meal ?? wanted,
      menu,
      corners: [],
      items: [],
      dishes: [],
      relations: {},
    };

    if (menu) {
      input.corners = await db("corner").where({ cafeteria_id: cafeteria.id });
      input.items = await db("menu_item as mi")
        .join("dish as d", "d.id", "mi.dish_id")
        .where("mi.daily_menu_id", menu.id)
        .andWhere("d.status", "published")
        .select("mi.id", "mi.daily_menu_id", "mi.corner_id", "mi.dish_id", "mi.price", "mi.sort");
      const dishIds = [...new Set(input.items.map((i) => i.dish_id))];
      input.dishes = dishIds.length
        ? await db("dish")
            .whereIn("id", dishIds)
            .andWhere({ status: "published" })
            .select(...DISH_COLUMNS)
        : [];
      input.relations = await loadRelations(
        db,
        input.dishes.map((d) => d.id),
      );
    }

    res.set("Cache-Control", "public, max-age=60");
    res.json({ data: toMenuView(input) });
  });

  const cafeterias = safe("cafeterias", async (_req, res) => {
    const rows = await db("cafeteria").where({ is_active: true }).select("*");
    rows.sort((a, b) => String(a.code).localeCompare(String(b.code)));
    res.set("Cache-Control", "public, max-age=60");
    res.json({ data: rows.filter((c) => c.is_active === true).map(toCafeteriaView) });
  });

  const cafeteria = safe("cafeteria", async (req, res) => {
    const row = await db("cafeteria")
      .where({ code: String(req.params.code), is_active: true })
      .first();
    if (!row || row.is_active !== true)
      return fail(res, 404, "CAFETERIA_NOT_FOUND", "Cafeteria not found");
    res.set("Cache-Control", "public, max-age=60");
    res.json({ data: toCafeteriaView(row) });
  });

  const dish = safe("dish", async (req, res) => {
    // dish.id is a uuid column: a malformed id would make PostgreSQL throw, so answer 404 up front.
    if (!UUID_RE.test(String(req.params.id)))
      return fail(res, 404, "DISH_NOT_FOUND", "Dish not found");
    const row = await db("dish")
      .where({ id: String(req.params.id), status: "published" })
      .select(...DISH_COLUMNS)
      .first();
    if (!row || row.status !== "published")
      return fail(res, 404, "DISH_NOT_FOUND", "Dish not found");
    const relations = await loadRelations(db, [row.id]);
    res.set("Cache-Control", "public, max-age=60");
    res.json({ data: toDishView(row, relations) });
  });

  return { todayMenu, cafeterias, cafeteria, dish };
}
