import { describe, expect, it } from "vitest";
import { localize } from "./localize";

const text = { ko: "된장찌개", en: "Soybean paste stew", vi: "Canh tương đậu" };

describe("localize (BR2 fallback)", () => {
  it("uses the requested language when available", () => {
    expect(localize(text, "vi")).toEqual({ text: "Canh tương đậu", lang: "vi", isFallback: false });
  });

  it("falls back to English, then Korean", () => {
    expect(localize(text, "mn")).toEqual({
      text: "Soybean paste stew",
      lang: "en",
      isFallback: true,
    });
    expect(localize({ ko: "김치" }, "uz")).toEqual({ text: "김치", lang: "ko", isFallback: true });
  });

  it("treats blank translations as missing", () => {
    expect(localize({ ko: "김치", vi: "  " }, "vi").lang).toBe("ko");
  });

  it("is not a fallback when Korean is requested", () => {
    expect(localize({ ko: "김치" }, "ko").isFallback).toBe(false);
  });
});
