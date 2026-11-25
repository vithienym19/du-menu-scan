import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs helper without type declarations
import { loadAllergens, loadDietTags, loadIngredients, parseCsv } from "../scripts/seed-lib.mjs";

interface Allergen {
  code: string;
  name_ko: string;
  names: Record<string, string>;
}
interface Ingredient {
  name_ko: string;
  names: Record<string, string>;
  diet_tags: string[];
}

const allergens: Allergen[] = loadAllergens();
const dietTags: { code: string }[] = loadDietTags();
const ingredients: Ingredient[] = loadIngredients();

const SNAKE = /^[a-z]+(_[a-z]+)*$/;

// Official MFDS 19-item list (식품등의 표시기준 별지 1) with the codes of product/data-specification.md.
const OFFICIAL_CODES = [
  "egg",
  "milk",
  "buckwheat",
  "peanut",
  "soy",
  "wheat",
  "mackerel",
  "crab",
  "shrimp",
  "pork",
  "peach",
  "tomato",
  "sulfite",
  "walnut",
  "chicken",
  "beef",
  "squid",
  "shellfish",
  "pine_nut",
];

// warning.ts keys that are NOT official allergen codes: they are members of the 조개류 group
// (oyster, abalone, mussel). Reconciling warning.ts is a lead-engineer task; any other
// unknown key makes this test fail.
const KNOWN_SUBGROUP_KEYS = ["oyster", "abalone", "mussel"];

function impliesTagKeys(): string[] {
  const source = readFileSync(
    new URL("../../packages/shared/src/warning.ts", import.meta.url),
    "utf8",
  );
  const block = /const ALLERGEN_IMPLIES_TAG[^=]*=\s*\{([^}]*)\}/.exec(source);
  if (!block?.[1]) throw new Error("ALLERGEN_IMPLIES_TAG not found in warning.ts");
  return [...block[1].matchAll(/^\s*([a-z_]+)\s*:/gm)].map((m) => m[1] as string);
}

describe("parseCsv", () => {
  it("handles comments, quotes, commas and escaped quotes", () => {
    const rows = parseCsv('# c\na,b\n"x,1","he said ""hi"""\n\n# mid\ny,z\n');
    expect(rows).toEqual([
      { a: "x,1", b: 'he said "hi"' },
      { a: "y", b: "z" },
    ]);
  });
  it("rejects ragged rows and unterminated quotes", () => {
    expect(() => parseCsv("a,b\n1\n")).toThrow(/cells/);
    expect(() => parseCsv('a\n"x\n')).toThrow(/unterminated/);
  });
});

describe("allergens.csv", () => {
  it("documents source, date and verification in the header", () => {
    const text = readFileSync(new URL("./allergens.csv", import.meta.url), "utf8");
    expect(text).toMatch(/식품등의 표시기준/);
    expect(text).toMatch(/As of: \d{4}-\d{2}-\d{2}/);
    expect(text).toMatch(/VERIFY BEFORE LAUNCH/);
  });
  it("contains exactly the 19 official codes, unique", () => {
    const codes = allergens.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort()).toEqual([...OFFICIAL_CODES].sort());
  });
  it("has snake_case codes, Korean names and en/vi/zh names", () => {
    for (const a of allergens) {
      expect(a.code).toMatch(SNAKE);
      expect(a.name_ko).not.toBe("");
      for (const lang of ["en", "vi", "zh"])
        expect(a.names[lang], `${a.code}.${lang}`).toBeTruthy();
    }
  });
});

describe("diet_tags.csv", () => {
  it("has the five spec codes, unique", () => {
    expect(dietTags.map((t) => t.code).sort()).toEqual(
      ["alcohol", "beef", "chicken", "pork", "seafood"].sort(),
    );
  });
});

describe("ingredients.csv", () => {
  it("has unique, non-empty Korean names and at least 50 rows", () => {
    const names = ingredients.map((i) => i.name_ko);
    expect(names.every(Boolean)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThanOrEqual(50);
  });
  it("has en/vi/zh names", () => {
    for (const i of ingredients) {
      for (const lang of ["en", "vi", "zh"])
        expect(i.names[lang], `${i.name_ko}.${lang}`).toBeTruthy();
    }
  });
  it("references only existing diet tags, without repeats", () => {
    const codes = new Set(dietTags.map((t) => t.code));
    for (const i of ingredients) {
      for (const t of i.diet_tags) expect(codes.has(t), `${i.name_ko}: ${t}`).toBe(true);
      expect(new Set(i.diet_tags).size).toBe(i.diet_tags.length);
    }
  });
  it("tags the hidden ingredients called out in the spec", () => {
    const tags = (n: string) => ingredients.find((i) => i.name_ko === n)?.diet_tags;
    expect(tags("멸치 육수")).toContain("seafood");
    expect(tags("어묵")).toContain("seafood");
    expect(tags("새우젓")).toContain("seafood");
    expect(tags("햄")).toContain("pork");
    expect(tags("미림")).toContain("alcohol");
    expect(tags("사골 육수")).toContain("beef");
  });
});

describe("warning.ts ALLERGEN_IMPLIES_TAG vs allergens.csv", () => {
  const keys = impliesTagKeys();
  const codes = new Set(allergens.map((a) => a.code));
  it("parses the map", () => {
    expect(keys.length).toBeGreaterThan(0);
  });
  it("every key is an allergen code, or a known 조개류 member", () => {
    const unknown = keys.filter((k) => !codes.has(k) && !KNOWN_SUBGROUP_KEYS.includes(k));
    expect(unknown).toEqual([]);
  });
  it("official keys exist in the seed", () => {
    for (const k of keys.filter((k) => OFFICIAL_CODES.includes(k))) expect(codes.has(k)).toBe(true);
  });
});
