import { describe, expect, it } from "vitest";
import {
  localized,
  toCafeteriaView,
  toDishView,
  toMenuView,
} from "../extensions/du-menu-endpoint/dist/map.js";

const cafeteria = {
  id: "c1",
  code: "main-hall",
  name_ko: "학생식당",
  names: { en: "Main Hall", vi: "" },
  opening_hours: { lunch: "11:30-13:30" },
};
const menu = { id: "m1", status: "published" };
const corners = [
  { id: "k2", name_ko: "분식", names: null, sort: 2 },
  { id: "k1", name_ko: "한식", names: '{"en":"Korean"}', sort: 1 },
  { id: "k3", name_ko: "빈 코너", names: null, sort: 3 },
];
const dish = (id, extra = {}) => ({
  id,
  name_ko: `요리${id}`,
  description_ko: null,
  spice_level: 1,
  allergens_confirmed: true,
  verified_at: new Date("2026-11-20T00:00:00Z"),
  diet_tags: [],
  status: "published",
  ...extra,
});
const relations = {
  translations: [
    { dish_id: "d1", lang: "en", name: "Soup", description: "Hot", status: "approved" },
    { dish_id: "d1", lang: "vi", name: "Canh", description: null, status: "draft" },
    { dish_id: "d1", lang: "zh", name: "  ", description: null, status: "approved" },
  ],
  dishIngredients: [
    { dish_id: "d1", ingredient_id: "i1", is_main: false, is_hidden: true },
    { dish_id: "d1", ingredient_id: "gone", is_main: true, is_hidden: false },
  ],
  ingredients: [{ id: "i1", name_ko: "멸치 육수", names: { en: "Anchovy broth" } }],
  ingredientTags: [{ ingredient_id: "i1", diet_tag_code: "seafood" }],
  dishAllergens: [
    { dish_id: "d1", allergen_code: "soy" },
    { dish_id: "d1", allergen_code: "unknown" },
  ],
  allergens: [{ code: "soy", name_ko: "대두", names: { en: "Soy" } }],
};

describe("localized", () => {
  it("keeps Korean, drops empty and ko extras, accepts JSON strings", () => {
    expect(localized(" 김치 ", { en: "Kimchi", vi: " ", ko: "x" })).toEqual({
      ko: "김치",
      en: "Kimchi",
    });
    expect(localized("a", '{"en":"A"}')).toEqual({ ko: "a", en: "A" });
    expect(localized("a", "not json")).toEqual({ ko: "a" });
    expect(localized("a", [1])).toEqual({ ko: "a" });
  });
});

describe("toCafeteriaView", () => {
  it("maps names and only the opening hours that exist", () => {
    expect(toCafeteriaView(cafeteria)).toEqual({
      id: "c1",
      code: "main-hall",
      name: { ko: "학생식당", en: "Main Hall" },
      openingHours: { lunch: "11:30-13:30" },
    });
    expect(toCafeteriaView({ ...cafeteria, opening_hours: null }).openingHours).toEqual({});
  });
});

describe("toDishView", () => {
  it("includes approved translations only and derives diet tags from ingredients", () => {
    const v = toDishView(dish("d1", { description_ko: "국" }), relations);
    expect(v.name).toEqual({ ko: "요리d1", en: "Soup" });
    expect(v.description).toEqual({ ko: "국", en: "Hot" });
    expect(v.ingredients).toEqual([
      { name: { ko: "멸치 육수", en: "Anchovy broth" }, isMain: false, isHidden: true },
    ]);
    expect(v.dietTags).toEqual(["seafood"]);
    expect(v.allergens).toEqual([{ code: "soy", name: { ko: "대두", en: "Soy" } }]);
    expect(v.verifiedAt).toBe("2026-11-20");
    expect(v.photoUrl).toBeNull();
  });

  it("merges stored tags and never invents verification", () => {
    const v = toDishView(
      dish("d9", {
        diet_tags: '["pork","bogus"]',
        verified_at: null,
        allergens_confirmed: null,
        spice_level: null,
      }),
      {},
    );
    expect(v.dietTags).toEqual(["pork"]);
    expect(v.verifiedAt).toBeNull();
    expect(v.allergensConfirmed).toBe(false);
    expect(v.description).toBeUndefined();
    expect(v.spiceLevel).toBe(4);
  });
});

describe("toMenuView", () => {
  const items = [
    { id: 3, daily_menu_id: "m1", corner_id: "k2", dish_id: "d2", price: 4000, sort: 1 },
    { id: 1, daily_menu_id: "m1", corner_id: "k1", dish_id: "d1", price: null, sort: 1 },
    { id: 2, daily_menu_id: "m1", corner_id: "k1", dish_id: "draft", price: 1, sort: 2 },
    { id: 4, daily_menu_id: "other", corner_id: "k1", dish_id: "d2", price: 1, sort: 3 },
  ];
  const dishes = [dish("d1"), dish("d2"), dish("draft", { status: "draft" })];

  it("orders corners, drops draft dishes and empty corners", () => {
    const v = toMenuView({
      cafeteria,
      date: "2026-11-25",
      meal: "lunch",
      menu,
      corners,
      items,
      dishes,
      relations,
    });
    expect(v.status).toBe("published");
    expect(v.corners.map((c) => c.id)).toEqual(["k1", "k2"]);
    expect(v.corners[0].name).toEqual({ ko: "한식", en: "Korean" });
    expect(v.corners[0].items.map((i) => i.dish.id)).toEqual(["d1"]);
    expect(v.corners[0].items[0].price).toBeNull();
    expect(v.corners[1].items[0].price).toBe(4000);
  });

  it("is empty without a published menu or without visible dishes", () => {
    const common = { cafeteria, date: "2026-11-25", meal: "dinner", corners, relations };
    expect(toMenuView({ ...common, menu: null, items, dishes })).toMatchObject({
      status: "empty",
      meal: "dinner",
      corners: [],
    });
    expect(
      toMenuView({ ...common, menu: { id: "m1", status: "draft" }, items, dishes }).status,
    ).toBe("empty");
    expect(
      toMenuView({ ...common, menu, items, dishes: [dish("draft", { status: "draft" })] }),
    ).toMatchObject({
      status: "empty",
      corners: [],
    });
  });
});
