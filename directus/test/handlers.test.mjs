import { describe, expect, it } from "vitest";
import { createHandlers } from "../extensions/du-menu-endpoint/dist/handlers.js";

// Stub knex: records every condition and returns canned rows per table. It does NOT filter,
// so the tests assert on the recorded conditions: remove a safety filter and a test fails.
function stubDb(tables) {
  const queries = [];
  const db = (name) => {
    const table = name.split(" as ")[0];
    const q = { table, conds: [] };
    queries.push(q);
    const rows = () => tables[table] ?? [];
    const b = {
      where(a, ...rest) {
        if (a && typeof a === "object")
          for (const [k, v] of Object.entries(a)) q.conds.push([k, "=", v]);
        else q.conds.push(rest.length === 1 ? [a, "=", rest[0]] : [a, rest[0], rest[1]]);
        return b;
      },
      whereIn(col, vals) {
        q.conds.push([col, "in", vals]);
        return b;
      },
      join: () => b,
      select: () => b,
      first: async () => rows()[0],
      then: (ok, bad) => Promise.resolve(rows()).then(ok, bad),
    };
    b.andWhere = b.where;
    return b;
  };
  db.queries = queries;
  db.has = (table, cond) =>
    queries.some(
      (q) =>
        q.table === table &&
        q.conds.some((c) => c[0] === cond[0] && c[1] === cond[1] && c[2] === cond[2]),
    );
  return db;
}

function call(handler, { params = {}, query = {} } = {}) {
  const out = { status: 200, headers: {}, body: undefined };
  const res = {
    status(s) {
      out.status = s;
      return res;
    },
    set(k, v) {
      out.headers[k] = v;
      return res;
    },
    json(b) {
      out.body = b;
      return res;
    },
  };
  return handler({ params, query }, res).then(() => out);
}

const DISH_ID = "11111111-1111-4111-8111-111111111111";
const cafe = {
  id: "c1",
  code: "main-hall",
  name_ko: "학생식당",
  names: { en: "Main Hall" },
  opening_hours: { lunch: "11:30-13:30" },
  is_active: true,
};
const dishRow = {
  id: DISH_ID,
  name_ko: "김치찌개",
  description_ko: null,
  spice_level: 2,
  allergens_confirmed: true,
  verified_at: "2026-11-20",
  diet_tags: [],
  status: "published",
};
const clock = () => ({ date: "2026-11-25", hour: 10 });

describe("GET /du/cafeterias", () => {
  it("lists only active cafeterias", async () => {
    const db = stubDb({ cafeteria: [cafe, { ...cafe, id: "c0", code: "old", is_active: false }] });
    const r = await call(createHandlers(db, clock).cafeterias);
    expect(db.has("cafeteria", ["is_active", "=", true])).toBe(true);
    expect(r.body.data.map((c) => c.code)).toEqual(["main-hall"]);
    expect(r.body.data[0]).toEqual({
      id: "c1",
      code: "main-hall",
      name: { ko: "학생식당", en: "Main Hall" },
      openingHours: { lunch: "11:30-13:30" },
    });
  });
});

describe("GET /du/cafeterias/{code}", () => {
  it("filters on is_active and returns the view", async () => {
    const db = stubDb({ cafeteria: [cafe] });
    const r = await call(createHandlers(db, clock).cafeteria, { params: { code: "main-hall" } });
    expect(db.has("cafeteria", ["is_active", "=", true])).toBe(true);
    expect(db.has("cafeteria", ["code", "=", "main-hall"])).toBe(true);
    expect(r.body.data.code).toBe("main-hall");
  });
  it("404 when unknown or inactive", async () => {
    const none = await call(createHandlers(stubDb({}), clock).cafeteria, { params: { code: "x" } });
    expect(none.status).toBe(404);
    const off = await call(
      createHandlers(stubDb({ cafeteria: [{ ...cafe, is_active: false }] }), clock).cafeteria,
      { params: { code: "main-hall" } },
    );
    expect(off.status).toBe(404);
  });
});

describe("GET /du/dishes/{id}", () => {
  const tables = {
    dish: [dishRow],
    dish_translation: [{ dish_id: DISH_ID, lang: "en", name: "Kimchi stew", status: "approved" }],
    dish_ingredient: [{ dish_id: DISH_ID, ingredient_id: "i1", is_main: true, is_hidden: false }],
    ingredient: [{ id: "i1", name_ko: "돼지고기", names: { en: "Pork" } }],
    ingredient_diet_tag: [{ ingredient_id: "i1", diet_tag_code: "pork" }],
  };
  it("filters dish on published and translations on approved", async () => {
    const db = stubDb(tables);
    const r = await call(createHandlers(db, clock).dish, { params: { id: DISH_ID } });
    expect(db.has("dish", ["status", "=", "published"])).toBe(true);
    expect(db.has("dish_translation", ["status", "=", "approved"])).toBe(true);
    expect(r.body.data.name).toEqual({ ko: "김치찌개", en: "Kimchi stew" });
    expect(r.body.data.dietTags).toEqual(["pork"]);
  });
  it("404 for a missing, draft or malformed id", async () => {
    const missing = await call(createHandlers(stubDb({}), clock).dish, { params: { id: DISH_ID } });
    expect(missing.status).toBe(404);
    const draft = await call(
      createHandlers(stubDb({ dish: [{ ...dishRow, status: "draft" }] }), clock).dish,
      { params: { id: DISH_ID } },
    );
    expect(draft.status).toBe(404);
    const db = stubDb(tables);
    const bad = await call(createHandlers(db, clock).dish, { params: { id: "not-a-uuid" } });
    expect(bad.status).toBe(404);
    expect(db.queries).toHaveLength(0);
  });
});

describe("GET /du/menu/{code}/today", () => {
  const tables = {
    cafeteria: [cafe],
    daily_menu: [{ id: "m1", meal: "lunch", status: "published" }],
    corner: [{ id: "k1", name_ko: "한식", names: null, sort: 1 }],
    menu_item: [
      { id: 1, daily_menu_id: "m1", corner_id: "k1", dish_id: DISH_ID, price: 4500, sort: 1 },
    ],
    dish: [dishRow],
    dish_translation: [{ dish_id: DISH_ID, lang: "en", name: "Kimchi stew", status: "approved" }],
  };
  it("applies every safety filter", async () => {
    const db = stubDb(tables);
    const r = await call(createHandlers(db, clock).todayMenu, { params: { code: "main-hall" } });
    expect(db.has("cafeteria", ["is_active", "=", true])).toBe(true);
    expect(db.has("daily_menu", ["status", "=", "published"])).toBe(true);
    expect(db.has("menu_item", ["d.status", "=", "published"])).toBe(true);
    expect(db.has("dish", ["status", "=", "published"])).toBe(true);
    expect(db.has("dish_translation", ["status", "=", "approved"])).toBe(true);
    expect(r.body.data.status).toBe("published");
    expect(r.body.data.corners[0].items[0].dish.name.en).toBe("Kimchi stew");
  });
  it("404 for an inactive cafeteria, 400 for bad input", async () => {
    const h = createHandlers(stubDb({ cafeteria: [] }), clock).todayMenu;
    expect((await call(h, { params: { code: "x" } })).status).toBe(404);
    expect((await call(h, { params: { code: "x" }, query: { date: "2026-13-01" } })).status).toBe(
      400,
    );
    expect((await call(h, { params: { code: "x" }, query: { meal: "brunch" } })).status).toBe(400);
  });
});
