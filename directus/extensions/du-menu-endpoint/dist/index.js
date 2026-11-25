// du-menu-endpoint: GET /du/menu/{code}/today (BE-11).
// One small, pre-shaped MenuView for S2. Reads with the raw knex handle, so Directus
// permissions do NOT apply: every query below filters explicitly on is_active, status=published
// (menus, dishes) and status=approved (translations). Never remove those filters.
import { toMenuView } from "./map.js";

const TIME_ZONE = process.env.MENU_TIMEZONE || "Asia/Seoul";
const MEALS = ["lunch", "dinner"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const fail = (res, status, code, message) =>
  res.status(status).json({ errors: [{ message, extensions: { code } }] });

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

const none = () => Promise.resolve([]);

export default {
  id: "du",
  handler: (router, { database: db }) => {
    router.get("/menu/:code/today", async (req, res) => {
      try {
        const code = String(req.params.code);
        const clock = now(TIME_ZONE);
        const date = req.query.date === undefined ? clock.date : String(req.query.date);
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
        const wanted = meal ?? (clock.hour < 15 ? "lunch" : "dinner");
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
                .select(
                  "id",
                  "name_ko",
                  "description_ko",
                  "spice_level",
                  "allergens_confirmed",
                  "verified_at",
                  "diet_tags",
                  "status",
                )
            : [];
          const ids = input.dishes.map((d) => d.id);
          const dishIngredients = ids.length
            ? await db("dish_ingredient")
                .whereIn("dish_id", ids)
                .select("dish_id", "ingredient_id", "is_main", "is_hidden")
            : [];
          const ingredientIds = [...new Set(dishIngredients.map((l) => l.ingredient_id))];
          input.relations = {
            dishIngredients,
            translations: ids.length
              ? await db("dish_translation")
                  .whereIn("dish_id", ids)
                  .andWhere({ status: "approved" })
                  .select("dish_id", "lang", "name", "description", "status")
              : await none(),
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

        res.set("Cache-Control", "public, max-age=60");
        res.json({ data: toMenuView(input) });
      } catch (err) {
        console.error("du-menu-endpoint failed", err);
        fail(res, 500, "INTERNAL_ERROR", "Could not load the menu");
      }
    });
  },
};
