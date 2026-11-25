import { describe, expect, it } from "vitest";
import { fixtureDishes } from "./fixtures";
import type { DishView, Prefs } from "./types";
import {
  NO_FILTERS,
  applyFilters,
  dietCompatibility,
  effectiveAvoidTags,
  evaluate,
  expandDietType,
  isVerified,
  sortByStatus,
} from "./warning";

const prefs = (over: Partial<Prefs> = {}): Prefs => ({
  lang: "en",
  avoidTags: [],
  avoidAllergens: [],
  spiceTolerance: 4,
  dietType: "none",
  onboarded: true,
  ...over,
});

const dish = (over: Partial<DishView> = {}): DishView => ({
  id: "d",
  name: { ko: "테스트", en: "Test" },
  photoUrl: null,
  spiceLevel: 0,
  ingredients: [],
  allergens: [],
  dietTags: [],
  allergensConfirmed: true,
  verifiedAt: "2026-11-20",
  ...over,
});

const allergen = (code: string) => ({ code, name: { ko: code } });

/** Mimics malformed API data that slipped past the types. */
const broken = (over: Record<string, unknown>): DishView => ({ ...dish(), ...over }) as DishView;

describe("BR6 — evaluate()", () => {
  it("BR6-ok: verified dish with no avoided item and spice within tolerance is ok", () => {
    expect(evaluate(dish({ spiceLevel: 2 }), prefs({ spiceTolerance: 2 }))).toEqual({
      status: "ok",
      reasons: [],
      unverified: false,
    });
  });

  it("BR6-avoid-tag: avoided diet tag → avoid", () => {
    const r = evaluate(dish({ dietTags: ["pork"] }), prefs({ avoidTags: ["pork"] }));
    expect(r.status).toBe("avoid");
    expect(r.reasons).toEqual([{ kind: "tag", code: "pork" }]);
  });

  it("BR6-avoid-allergen: avoided allergen → avoid", () => {
    const r = evaluate(dish({ allergens: [allergen("egg")] }), prefs({ avoidAllergens: ["egg"] }));
    expect(r.status).toBe("avoid");
    expect(r.reasons).toEqual([{ kind: "allergen", code: "egg" }]);
  });

  it("BR5/BR6-hidden: hidden ingredients count — anchovy broth in 된장찌개 is avoid for seafood", () => {
    const doenjang = fixtureDishes.find((d) => d.id === "dish-doenjang-jjigae")!;
    expect(doenjang.ingredients.some((i) => i.isHidden)).toBe(true);
    expect(evaluate(doenjang, prefs({ avoidTags: ["seafood"] })).status).toBe("avoid");
  });

  it("BR6-avoid-beats-spice: avoid wins over caution and lists both reasons, avoid first", () => {
    const r = evaluate(
      dish({ dietTags: ["pork"], spiceLevel: 3 }),
      prefs({ avoidTags: ["pork"], spiceTolerance: 1 }),
    );
    expect(r.status).toBe("avoid");
    expect(r.reasons).toEqual([
      { kind: "tag", code: "pork" },
      { kind: "spice", level: 3, tolerance: 1 },
    ]);
  });

  it("BR6-caution: spice level above tolerance → caution", () => {
    const r = evaluate(dish({ spiceLevel: 2 }), prefs({ spiceTolerance: 1 }));
    expect(r).toEqual({
      status: "caution",
      reasons: [{ kind: "spice", level: 2, tolerance: 1 }],
      unverified: false,
    });
  });

  it("BR6-spice-equal: spice equal to tolerance is ok", () => {
    expect(evaluate(dish({ spiceLevel: 1 }), prefs({ spiceTolerance: 1 })).status).toBe("ok");
  });

  it("BR6-spice-zero-tolerance: 'not spicy only' student gets caution on level 1", () => {
    expect(evaluate(dish({ spiceLevel: 1 }), prefs({ spiceTolerance: 0 })).status).toBe("caution");
  });

  it("BR6-dedupe: pork as tag and allergen is reported once", () => {
    const r = evaluate(
      dish({ dietTags: ["pork"], allergens: [allergen("pork"), allergen("wheat")] }),
      prefs({ avoidTags: ["pork"], avoidAllergens: ["pork", "wheat"] }),
    );
    expect(r.reasons).toEqual([
      { kind: "tag", code: "pork" },
      { kind: "allergen", code: "wheat" },
    ]);
  });

  it("BR6-duplicate-tags: duplicated tags in data are reported once", () => {
    const r = evaluate(dish({ dietTags: ["beef", "beef"] }), prefs({ avoidTags: ["beef"] }));
    expect(r.reasons).toEqual([{ kind: "tag", code: "beef" }]);
  });

  it("BR6-no-prefs: student without preferences sees ok for any verified dish", () => {
    const r = evaluate(
      dish({ dietTags: ["pork"], allergens: [allergen("egg")], spiceLevel: 4 }),
      prefs(),
    );
    expect(r.status).toBe("ok");
  });
});

describe("BR6 — unknown data is never ok", () => {
  const cases: [string, DishView][] = [
    ["allergens not confirmed", dish({ allergensConfirmed: false })],
    ["never verified", dish({ verifiedAt: null })],
    ["empty verification date", dish({ verifiedAt: "" })],
    ["malformed verification date", dish({ verifiedAt: "20/11/2026" })],
    ["impossible verification date", dish({ verifiedAt: "2026-02-31" })],
    ["spice level missing", broken({ spiceLevel: undefined })],
    ["spice level out of range", broken({ spiceLevel: 7 })],
    ["spice level not an integer", broken({ spiceLevel: 1.5 })],
    ["allergens missing", broken({ allergens: undefined })],
    ["diet tags missing", broken({ dietTags: null })],
    ["allergensConfirmed not boolean", broken({ allergensConfirmed: "true" })],
  ];

  it.each(cases)("BR6-unverified: %s → unverified", (_, d) => {
    const r = evaluate(d, prefs());
    expect(r.status).toBe("unverified");
    expect(r.unverified).toBe(true);
    expect(isVerified(d)).toBe(false);
  });

  it("BR6-unverified-fixture: fixture 순두부찌개 without verification is unverified", () => {
    const sundubu = fixtureDishes.find((d) => d.id === "dish-sundubu-jjigae")!;
    expect(evaluate(sundubu, prefs({ spiceTolerance: 4 })).status).toBe("unverified");
  });

  it("BR6-unverified-spicy: unverified and too spicy stays unverified (not caution, not ok)", () => {
    const r = evaluate(dish({ verifiedAt: null, spiceLevel: 3 }), prefs({ spiceTolerance: 0 }));
    expect(r.status).toBe("unverified");
    expect(r.reasons).toEqual([{ kind: "spice", level: 3, tolerance: 0 }]);
  });

  it("BR6-unverified-known-hit: a known avoided item on unverified data → avoid (D-017)", () => {
    const r = evaluate(
      dish({ verifiedAt: null, dietTags: ["pork"] }),
      prefs({ dietType: "halal" }),
    );
    expect(r.status).toBe("avoid");
    expect(r.unverified).toBe(true);
  });

  it("ignores malformed allergen entries instead of crashing", () => {
    const d = broken({ allergens: [null, { code: 3 }, allergen("egg")] });
    expect(evaluate(d, prefs({ avoidAllergens: ["egg"] })).status).toBe("avoid");
  });

  it("invalid spice tolerance never produces caution or ok on its own", () => {
    const p = { ...prefs(), spiceTolerance: undefined } as unknown as Prefs;
    expect(evaluate(dish({ spiceLevel: 4 }), p).status).toBe("ok");
    expect(evaluate(dish({ verifiedAt: null, spiceLevel: 4 }), p).status).toBe("unverified");
  });
});

describe("diet type expansion", () => {
  it("halal → pork, alcohol", () => {
    expect(expandDietType("halal")).toEqual(["pork", "alcohol"]);
  });

  it("vegetarian → pork, beef, chicken, seafood", () => {
    expect(expandDietType("vegetarian")).toEqual(["pork", "beef", "chicken", "seafood"]);
  });

  it("none → nothing; unknown value → nothing", () => {
    expect(expandDietType("none")).toEqual([]);
    expect(expandDietType("keto" as never)).toEqual([]);
  });

  it("returns a copy that callers cannot use to mutate the rules", () => {
    expandDietType("halal").push("beef");
    expect(expandDietType("halal")).toEqual(["pork", "alcohol"]);
  });

  it("effective avoid tags merge ticked tags and diet type without duplicates", () => {
    expect(effectiveAvoidTags({ avoidTags: ["pork", "beef"], dietType: "halal" })).toEqual([
      "pork",
      "beef",
      "alcohol",
    ]);
  });

  it("BR6-halal: dish with cooking wine (alcohol) is avoid for halal", () => {
    expect(evaluate(dish({ dietTags: ["alcohol"] }), prefs({ dietType: "halal" })).status).toBe(
      "avoid",
    );
  });

  it("BR6-halal-beef: beef is fine for halal (tag level)", () => {
    expect(evaluate(dish({ dietTags: ["beef"] }), prefs({ dietType: "halal" })).status).toBe("ok");
  });

  it("BR6-vegetarian: hidden seafood (fish cake, anchovy broth) is avoid for vegetarians", () => {
    const tteokbokki = fixtureDishes.find((d) => d.id === "dish-tteokbokki")!;
    expect(evaluate(tteokbokki, prefs({ dietType: "vegetarian" })).status).toBe("avoid");
  });
});

describe("dietCompatibility()", () => {
  it("verified dish without forbidden tags is halal and vegetarian", () => {
    expect(dietCompatibility(dish())).toEqual({ halal: true, vegetarian: true });
  });

  it("pork → neither halal nor vegetarian", () => {
    expect(dietCompatibility(dish({ dietTags: ["pork"] }))).toEqual({
      halal: false,
      vegetarian: false,
    });
  });

  it("chicken → halal (tag level) but not vegetarian", () => {
    expect(dietCompatibility(dish({ dietTags: ["chicken"] }))).toEqual({
      halal: true,
      vegetarian: false,
    });
  });

  it("unverified dish never shows ✓, but known violations still show ✕", () => {
    expect(dietCompatibility(dish({ verifiedAt: null }))).toEqual({
      halal: null,
      vegetarian: null,
    });
    expect(dietCompatibility(dish({ verifiedAt: null, dietTags: ["alcohol"] }))).toEqual({
      halal: false,
      vegetarian: null,
    });
  });

  it("missing tags are treated as unknown", () => {
    expect(dietCompatibility(broken({ dietTags: undefined }))).toEqual({
      halal: null,
      vegetarian: null,
    });
  });
});

describe("sortByStatus()", () => {
  const item = (id: string, over: Partial<DishView>) => ({
    dish: dish({ id, ...over }),
    price: null,
  });

  it("orders OK → Caution → Not verified → Avoid and is stable", () => {
    const items = [
      item("avoid", { dietTags: ["pork"] }),
      item("unverified", { verifiedAt: null }),
      item("caution", { spiceLevel: 3 }),
      item("ok-1", {}),
      item("ok-2", {}),
    ];
    const sorted = sortByStatus(items, prefs({ avoidTags: ["pork"], spiceTolerance: 1 }));
    expect(sorted.map((i) => i.dish.id)).toEqual([
      "ok-1",
      "ok-2",
      "caution",
      "unverified",
      "avoid",
    ]);
  });

  it("does not mutate the input", () => {
    const items = [item("a", { dietTags: ["pork"] }), item("b", {})];
    sortByStatus(items, prefs({ avoidTags: ["pork"] }));
    expect(items.map((i) => i.dish.id)).toEqual(["a", "b"]);
  });
});

describe("applyFilters()", () => {
  const items = fixtureDishes.map((d) => ({ dish: d, price: null }));
  const ids = (list: { dish: DishView }[]) => list.map((i) => i.dish.id);

  it("no active filter returns every item (copy)", () => {
    const out = applyFilters(items, NO_FILTERS);
    expect(out).toEqual(items);
    expect(out).not.toBe(items);
  });

  it("not spicy keeps only verified spice-0 dishes", () => {
    const out = applyFilters(items, { ...NO_FILTERS, notSpicy: true });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((i) => i.dish.spiceLevel === 0)).toBe(true);
  });

  it("no pork removes pork dishes, including hidden pork (잡채)", () => {
    const out = ids(applyFilters(items, { ...NO_FILTERS, noPork: true }));
    expect(out).not.toContain("dish-jeyuk-bokkeum");
    expect(out).not.toContain("dish-japchae");
    expect(out).toContain("dish-yachae-bibimbap");
  });

  it("vegetarian removes meat and hidden seafood", () => {
    const out = ids(applyFilters(items, { ...NO_FILTERS, vegetarian: true }));
    expect(out).toEqual(["dish-yachae-bibimbap"]);
  });

  it("filters combine with AND", () => {
    const out = applyFilters(items, { notSpicy: true, noPork: true, vegetarian: false });
    expect(out.every((i) => i.dish.spiceLevel === 0 && !i.dish.dietTags.includes("pork"))).toBe(
      true,
    );
    expect(ids(out)).toContain("dish-udon");
  });

  it("any active filter hides unverified dishes (a filter is a positive claim)", () => {
    const out = ids(applyFilters(items, { ...NO_FILTERS, noPork: true }));
    expect(out).not.toContain("dish-sundubu-jjigae");
  });
});
