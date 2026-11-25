import { describe, expect, it } from "vitest";

import { isSafeInternalPath, isValidTodayPath, resolveWelcomeNextPath } from "./safePath";

describe("isSafeInternalPath", () => {
  it.each([
    ["/"],
    ["/welcome"],
    ["/r/main-hall/today"],
    ["/settings?next=%2Fr%2Fdorm%2Ftoday"],
    ["/%2F%2Fevil"],
  ])("accepts same-origin relative path %s", (path) => {
    expect(isSafeInternalPath(path)).toBe(true);
    expect(new URL(path, "https://du-menu.local").origin).toBe("https://du-menu.local");
  });

  it.each([
    ["//evil"],
    ["//evil.com/path"],
    ["/\\evil"],
    ["/foo\\bar"],
    ["\\evil"],
    ["https://evil.com"],
    ["http://evil.com/r/main-hall/today"],
    ["javascript:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["relative/path"],
    [""],
    [null],
  ])("rejects unsafe or non-relative path %s", (path) => {
    expect(isSafeInternalPath(path)).toBe(false);
  });
});

describe("isValidTodayPath / resolveWelcomeNextPath", () => {
  it.each(["/r/main-hall/today", "/r/dorm/today", "/r/eng-1/today"])(
    "accepts valid /r/:code/today path: %s",
    (path) => {
      expect(isValidTodayPath(path)).toBe(true);
      expect(resolveWelcomeNextPath(path)).toBe(path);
    },
  );

  it.each([
    ["//evil"],
    ["/\\evil"],
    ["/%2F%2Fevil"],
    ["https://evil.com/r/main-hall/today"],
    ["/settings"],
    ["/r/main-hall"],
    [""],
    [null],
  ])("rejects non-today or unsafe path %s and falls back to /", (path) => {
    expect(isValidTodayPath(path)).toBe(false);
    expect(resolveWelcomeNextPath(path)).toBe("/");
  });
});
