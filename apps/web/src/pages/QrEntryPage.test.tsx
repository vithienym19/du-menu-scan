import { createApi, DEFAULT_PREFS } from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import { api } from "../lib/api";
import { changeAppLanguage } from "../lib/i18n";
import { PREFS_STORAGE_KEY, readPrefs } from "../lib/prefs";

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderWithQuery(initialEntry: string, { strict = false } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const tree = (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

describe("readPrefs", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns DEFAULT_PREFS when nothing is stored", () => {
    expect(readPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("returns strictest fail-safe prefs when localStorage contains invalid JSON", () => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, "{not-valid-json");
    const prefs = readPrefs();
    expect(prefs.onboarded).toBe(false);
    expect(prefs.spiceTolerance).toBe(0);
    expect(prefs.avoidTags).toEqual(
      expect.arrayContaining(["pork", "alcohol", "beef", "chicken", "seafood"]),
    );
  });

  it("sanitizes corrupt safety fields", () => {
    window.localStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({
        lang: "en",
        avoidTags: ["pork", "invalid-tag"],
        avoidAllergens: ["egg"],
        spiceTolerance: 99,
        dietType: "halal",
        onboarded: true,
      }),
    );

    const prefs = readPrefs();
    expect(prefs.spiceTolerance).toBe(0);
    expect(prefs.onboarded).toBe(false);
    expect(prefs.avoidTags).toEqual(["pork"]);
  });

  it("returns valid stored prefs", () => {
    const saved = {
      lang: "vi",
      avoidTags: ["pork"],
      avoidAllergens: ["peanut"],
      spiceTolerance: 2,
      dietType: "halal",
      onboarded: true,
    };
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(saved));
    expect(readPrefs()).toEqual(saved);
  });
});

describe("UI-04 S1 QR entry route", () => {
  const mockApi = createApi({ baseUrl: "", useMock: true });

  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
    vi.spyOn(api, "getCafeteria").mockImplementation((code) => mockApi.getCafeteria(code));
    vi.spyOn(api, "listCafeterias").mockImplementation(() => mockApi.listCafeterias());
    vi.spyOn(api, "logScan").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects / to /welcome", () => {
    renderWithQuery("/");
    expect(screen.getByTestId("location")).toHaveTextContent("/welcome");
    expect(screen.getByText("See what's in today's menu")).toBeInTheDocument();
  });

  it.each(["main-hall", "dorm", "engineering"])(
    "redirects valid code %s to /welcome?next=... when not onboarded and logs scan once",
    async (code) => {
      renderWithQuery(`/r/${code}`);

      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent(
          `/welcome?next=${encodeURIComponent(`/r/${code}/today`)}`,
        );
      });

      expect(api.logScan).toHaveBeenCalledTimes(1);
      expect(api.logScan).toHaveBeenCalledWith({
        cafeteriaCode: code,
        lang: "en",
        entry: "qr",
      });
    },
  );

  it.each(["main-hall", "dorm", "engineering"])(
    "redirects valid code %s to /r/%s/today when onboarded",
    async (code) => {
      window.localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ ...DEFAULT_PREFS, onboarded: true }),
      );

      renderWithQuery(`/r/${code}`);

      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent(`/r/${code}/today`);
      });

      expect(api.logScan).toHaveBeenCalledTimes(1);
      expect(api.logScan).toHaveBeenCalledWith({
        cafeteriaCode: code,
        lang: "en",
        entry: "qr",
      });
    },
  );

  it("guards logScan against React StrictMode double effects", async () => {
    renderWithQuery("/r/main-hall", { strict: true });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        `/welcome?next=${encodeURIComponent("/r/main-hall/today")}`,
      );
    });

    expect(api.logScan).toHaveBeenCalledTimes(1);
  });

  it("shows invalid-code state with list of cafeterias as links for unknown code", async () => {
    renderWithQuery("/r/unknown-code");

    expect(screen.getByText("Loading…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("We couldn't find this cafeteria")).toBeInTheDocument();
    });

    expect(
      screen.getByText("The QR code may be old. Choose your cafeteria below."),
    ).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Student Union Cafeteria" })).toHaveAttribute(
      "href",
      "/r/main-hall",
    );
    expect(screen.getByRole("link", { name: "Dormitory Cafeteria" })).toHaveAttribute(
      "href",
      "/r/dorm",
    );
    expect(screen.getByRole("link", { name: "Engineering Cafeteria" })).toHaveAttribute(
      "href",
      "/r/engineering",
    );
    expect(api.logScan).not.toHaveBeenCalled();
  });

  it("shows error state with retry when getCafeteria fails and recovers on retry", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getCafeteria")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockImplementationOnce((code) => mockApi.getCafeteria(code));

    renderWithQuery("/r/main-hall");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        `/welcome?next=${encodeURIComponent("/r/main-hall/today")}`,
      );
    });
    expect(api.logScan).toHaveBeenCalledTimes(1);
  });
});
