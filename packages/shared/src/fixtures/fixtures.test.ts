import { describe, expect, it } from "vitest";
import { fixtureDishes, fixtureMenus } from "./index";

describe("fixtures cover the UI states", () => {
  it("has unique dish ids and a Korean + English name on each dish", () => {
    expect(new Set(fixtureDishes.map((d) => d.id)).size).toBe(fixtureDishes.length);
    for (const d of fixtureDishes) {
      expect(d.name.ko).toBeTruthy();
      expect(d.name.en).toBeTruthy();
    }
  });

  it("includes the edge cases the UI must handle", () => {
    expect(fixtureDishes.some((d) => d.verifiedAt === null)).toBe(true);
    expect(fixtureDishes.some((d) => !d.name.vi)).toBe(true);
    expect(fixtureDishes.some((d) => d.photoUrl === null)).toBe(true);
    expect(fixtureDishes.some((d) => d.ingredients.some((i) => i.isHidden))).toBe(true);
    expect(fixtureDishes.some((d) => d.spiceLevel === 4)).toBe(true);
    expect(
      Object.values(fixtureMenus)
        .map((m) => m.status)
        .sort(),
    ).toEqual(["closed", "empty", "published"]);
  });
});
