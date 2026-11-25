import { fixtureCafeterias, fixtureDishes, fixtureMenus } from "./fixtures";
import type { CafeteriaView, DishView, MenuView, ScanEventInput } from "./types";

export interface ApiConfig {
  /** Directus base URL, e.g. https://api.example.com */
  baseUrl: string;
  /** true → serve fixtures (VITE_USE_MOCK=true). */
  useMock: boolean;
  /** Artificial delay for mock responses, to see loading states. */
  mockDelayMs?: number;
  fetchImpl?: typeof fetch;
}

export interface Api {
  listCafeterias(): Promise<CafeteriaView[]>;
  /** null when the code does not exist. */
  getCafeteria(code: string): Promise<CafeteriaView | null>;
  /** null when the cafeteria does not exist. */
  getTodayMenu(code: string): Promise<MenuView | null>;
  getDish(id: string): Promise<DishView | null>;
  logScan(input: ScanEventInput): Promise<void>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Custom Directus endpoints under /du. They return the view types above.
 * Implemented so far: todayMenu (BE-11). cafeterias, cafeteria and dish are not built yet.
 */
export const ENDPOINTS = {
  cafeterias: "/du/cafeterias",
  cafeteria: (code: string) => `/du/cafeterias/${encodeURIComponent(code)}`,
  todayMenu: (code: string) => `/du/menu/${encodeURIComponent(code)}/today`,
  dish: (id: string) => `/du/dishes/${encodeURIComponent(id)}`,
  scanEvent: "/items/scan_event",
} as const;

export function createApi(config: ApiConfig): Api {
  return config.useMock ? createMockApi(config.mockDelayMs ?? 0) : createHttpApi(config);
}

function createMockApi(delayMs: number): Api {
  const wait = <T>(value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(structuredClone(value)), delayMs));
  return {
    listCafeterias: () => wait(fixtureCafeterias),
    getCafeteria: (code) => wait(fixtureCafeterias.find((c) => c.code === code) ?? null),
    getTodayMenu: (code) => wait(fixtureMenus[code] ?? null),
    getDish: (id) => wait(fixtureDishes.find((d) => d.id === id) ?? null),
    logScan: () => wait(undefined),
  };
}

function createHttpApi({ baseUrl, fetchImpl = fetch }: ApiConfig): Api {
  const base = baseUrl.replace(/\/$/, "");

  async function get<T>(path: string): Promise<T | null> {
    const res = await fetchImpl(`${base}${path}`, { headers: { Accept: "application/json" } });
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError(`GET ${path} failed`, res.status);
    const body = (await res.json()) as { data: T };
    return body.data;
  }

  return {
    listCafeterias: async () => (await get<CafeteriaView[]>(ENDPOINTS.cafeterias)) ?? [],
    getCafeteria: (code) => get<CafeteriaView>(ENDPOINTS.cafeteria(code)),
    getTodayMenu: (code) => get<MenuView>(ENDPOINTS.todayMenu(code)),
    getDish: (id) => get<DishView>(ENDPOINTS.dish(id)),
    async logScan({ cafeteriaCode, lang, entry }) {
      try {
        await fetchImpl(`${base}${ENDPOINTS.scanEvent}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cafeteria_code: cafeteriaCode, lang, entry }),
          keepalive: true,
        });
      } catch {
        // Analytics must never break the menu.
      }
    },
  };
}
