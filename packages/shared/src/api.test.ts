import { describe, expect, it, vi } from "vitest";
import { ApiError, createApi, ENDPOINTS } from "./api";

describe("mock api", () => {
  const api = createApi({ baseUrl: "", useMock: true });

  it("returns cafeterias and today's menus for every state", async () => {
    expect(await api.getCafeteria("main-hall")).not.toBeNull();
    expect(await api.getCafeteria("nope")).toBeNull();
    expect((await api.getTodayMenu("main-hall"))?.status).toBe("published");
    expect((await api.getTodayMenu("dorm"))?.status).toBe("empty");
    expect((await api.getTodayMenu("engineering"))?.status).toBe("closed");
    expect(await api.getTodayMenu("nope")).toBeNull();
    expect((await api.listCafeterias()).length).toBe(3);
  });

  it("returns copies so callers cannot mutate fixtures", async () => {
    const a = await api.getDish("dish-kimchi");
    a!.spiceLevel = 4;
    expect((await api.getDish("dish-kimchi"))!.spiceLevel).toBe(2);
    expect(await api.getDish("nope")).toBeNull();
  });

  it("logScan resolves", async () => {
    await expect(
      api.logScan({ cafeteriaCode: "main-hall", lang: "en", entry: "qr" }),
    ).resolves.toBeUndefined();
  });
});

describe("http api", () => {
  const json = (status: number, data?: unknown) =>
    new Response(data === undefined ? null : JSON.stringify({ data }), { status });

  it("unwraps Directus { data } and maps 404 to null", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(200, { id: "x", code: "main-hall" }))
      .mockResolvedValueOnce(json(404));
    const api = createApi({ baseUrl: "https://api.test/", useMock: false, fetchImpl });
    expect(await api.getCafeteria("main-hall")).toMatchObject({ code: "main-hall" });
    expect(await api.getDish("missing")).toBeNull();
    expect(fetchImpl.mock.calls[0]![0]).toBe(`https://api.test${ENDPOINTS.cafeteria("main-hall")}`);
  });

  it("throws ApiError on server errors and returns [] for empty lists", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(500))
      .mockResolvedValueOnce(json(404));
    const api = createApi({ baseUrl: "https://api.test", useMock: false, fetchImpl });
    await expect(api.getTodayMenu("main-hall")).rejects.toBeInstanceOf(ApiError);
    expect(await api.listCafeterias()).toEqual([]);
  });

  it("never throws from logScan", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error("offline"));
    const api = createApi({ baseUrl: "https://api.test", useMock: false, fetchImpl });
    await expect(
      api.logScan({ cafeteriaCode: "a", lang: "vi", entry: "qr" }),
    ).resolves.toBeUndefined();
    expect(JSON.parse(fetchImpl.mock.calls[0]![1]!.body as string)).toEqual({
      cafeteria_code: "a",
      lang: "vi",
      entry: "qr",
    });
  });
});
