import { describe, expect, it } from "vitest";
import { LANGUAGES, SUPPORTED_LANGUAGES, isLanguage, pickLanguage } from "./index";

describe("language helpers", () => {
  it("accepts supported languages only", () => {
    expect(isLanguage("vi")).toBe(true);
    expect(isLanguage("mn")).toBe(true);
    expect(isLanguage("ja")).toBe(false);
  });

  it("picks the first supported browser language", () => {
    expect(pickLanguage(["ja-JP", "vi-VN", "en-US"])).toBe("vi");
    expect(pickLanguage(["zh-CN"])).toBe("zh");
    expect(pickLanguage(["uz-Latn-UZ"])).toBe("uz");
    expect(pickLanguage(["ne-NP"])).toBe("ne");
    expect(pickLanguage(["ko"])).toBe("ko");
  });

  it("falls back to English", () => {
    expect(pickLanguage(["ja", "fr"])).toBe("en");
    expect(pickLanguage([])).toBe("en");
  });

  it("keeps the language list and metadata in sync", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual([...SUPPORTED_LANGUAGES]);
  });
});
