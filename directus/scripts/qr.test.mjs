import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { entryUrl, parseCafeterias, qrPng, validateCode, validateDomain } from "./qr-lib.mjs";

describe("validateDomain", () => {
  it("accepts the team domain with or without https://", () => {
    expect(validateDomain("menu.example.org")).toBe("menu.example.org");
    expect(validateDomain("https://Menu.Example.org/")).toBe("menu.example.org");
    expect(validateDomain("menu.example.org.")).toBe("menu.example.org");
  });

  it.each([
    "du-menu.vercel.app",
    "du-menu.pages.dev",
    "x.netlify.app",
    "api.up.railway.app",
    "foo.onrender.com",
    "team.github.io",
    "abc.supabase.co",
    "x.vercel.app.",
    "x.vercel.app%2e",
    "X.VERCEL.APP",
  ])("rejects hosting-provider host %s", (host) => {
    expect(() => validateDomain(host)).toThrow(/hosting-provider/);
  });

  it.each([
    ["", /Missing/],
    ["http://menu.example.org", /https/],
    ["menu.example.org/r/x", /only the host/],
    ["menu.example.org:8443", /only the host/],
    ["menu.example.org:443", /only the host/],
    ["user@menu.example.org", /only the host/],
    ["localhost.", /localhost/],
    ["app.localhost", /localhost/],
    ["a..b", /Invalid/],
    ["localhost", /localhost/],
    ["192.168.0.10", /IP/],
    ["intranet", /Invalid/],
  ])("rejects %j", (input, message) => {
    expect(() => validateDomain(input)).toThrow(message);
  });
});

describe("cafeteria codes", () => {
  it("accepts slug codes and rejects others", () => {
    expect(validateCode("main-hall")).toBe("main-hall");
    for (const bad of ["Main", "main hall", "-x", "x--y", "../x", ""]) {
      expect(() => validateCode(bad)).toThrow(/Invalid cafeteria code/);
    }
  });

  it("parses code=name pairs and refuses duplicates", () => {
    expect(parseCafeterias(["main-hall=학생회관 식당", "dorm"])).toEqual([
      { code: "main-hall", name: "학생회관 식당" },
      { code: "dorm", name: null },
    ]);
    expect(() => parseCafeterias(["dorm", "dorm=Dorm"])).toThrow(/Duplicate/);
    expect(() => parseCafeterias([])).toThrow(/at least one/);
  });
});

describe("QR content", () => {
  it("builds the S1 route on the team domain", () => {
    expect(entryUrl("menu.example.org", "main-hall")).toBe("https://menu.example.org/r/main-hall");
  });

  it("encodes exactly the entry URL (decoded back from the PNG)", async () => {
    const url = entryUrl("menu.example.org", "engineering");
    const png = PNG.sync.read(await qrPng(url, 400));
    const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    expect(decoded?.data).toBe(url);
  });
});
