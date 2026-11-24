import { describe, expect, it } from "vitest";
import { isLanguage, pickLanguage } from "./index";

describe("language helpers", () => {
  it("accepts supported languages only", () => {
    expect(isLanguage("vi")).toBe(true);
    expect(isLanguage("ja")).toBe(false);
  });

  it("picks the first supported browser language", () => {
    expect(pickLanguage(["ja-JP", "vi-VN", "en-US"])).toBe("vi");
    expect(pickLanguage(["zh-CN"])).toBe("zh");
    expect(pickLanguage(["ko"])).toBe("ko");
  });

  it("falls back to English", () => {
    expect(pickLanguage(["ja", "fr"])).toBe("en");
    expect(pickLanguage([])).toBe("en");
  });
});
