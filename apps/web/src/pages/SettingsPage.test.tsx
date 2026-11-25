import {
  createApi,
  DEFAULT_PREFS,
  evaluate,
  expandDietType,
  fixtureDishes,
} from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import { api } from "../lib/api";
import { changeAppLanguage, LANGUAGE_STORAGE_KEY } from "../lib/i18n";
import { PREFS_STORAGE_KEY, readPrefs, usePrefs } from "../lib/prefs";
import { SettingsPage } from "./SettingsPage";

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderWithQuery(initialEntries: string[] = ["/settings"], initialIndex?: number) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <AppRoutes />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UI-08 S4 My diet and local preferences", () => {
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

  it("renders language radios, diet type radios, 7 avoid checkboxes, spice tolerance radios, privacy note and save button with >= 44px hit areas", () => {
    renderWithQuery(["/settings"]);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("My diet");
    expect(screen.getByText("Your settings stay on this phone.")).toBeInTheDocument();

    const porkCheckbox = screen.getByRole("checkbox", { name: /Pork/i });
    const beefCheckbox = screen.getByRole("checkbox", { name: /Beef/i });
    const chickenCheckbox = screen.getByRole("checkbox", { name: /Chicken/i });
    const seafoodCheckbox = screen.getByRole("checkbox", { name: /Seafood/i });
    const nutsCheckbox = screen.getByRole("checkbox", { name: /Nuts/i });
    const milkEggCheckbox = screen.getByRole("checkbox", { name: /Milk & egg/i });
    const wheatCheckbox = screen.getByRole("checkbox", { name: /Wheat/i });

    for (const input of [
      porkCheckbox,
      beefCheckbox,
      chickenCheckbox,
      seafoodCheckbox,
      nutsCheckbox,
      milkEggCheckbox,
      wheatCheckbox,
    ]) {
      expect(input).not.toBeChecked();
      expect(input.closest("label")).toHaveClass("min-h-11");
    }

    const noRestrictionRadio = screen.getByRole("radio", { name: "No restriction" });
    const vegetarianRadio = screen.getByRole("radio", { name: "Vegetarian" });
    const halalRadio = screen.getByRole("radio", { name: "Halal" });
    expect(noRestrictionRadio).toBeChecked();
    expect(vegetarianRadio.closest("label")).toHaveClass("min-h-11");
    expect(halalRadio.closest("label")).toHaveClass("min-h-11");

    const spiceNone = screen.getByRole("radio", { name: "Not spicy only" });
    const spiceSome = screen.getByRole("radio", { name: "A little spicy" });
    const spiceAny = screen.getByRole("radio", { name: "Any" });
    expect(spiceAny).toBeChecked();
    expect(spiceNone.closest("label")).toHaveClass("min-h-11");
    expect(spiceSome.closest("label")).toHaveClass("min-h-11");
  });

  it("auto-ticks pork for Halal and pork/beef/chicken/seafood for Vegetarian via expandDietType()", async () => {
    const user = userEvent.setup();
    renderWithQuery(["/settings"]);

    const pork = screen.getByRole("checkbox", { name: /Pork/i });
    const beef = screen.getByRole("checkbox", { name: /Beef/i });
    const chicken = screen.getByRole("checkbox", { name: /Chicken/i });
    const seafood = screen.getByRole("checkbox", { name: /Seafood/i });

    // Select Halal -> auto-ticks Pork (and expands alcohol on save via expandDietType("halal"))
    await user.click(screen.getByRole("radio", { name: "Halal" }));
    expect(pork).toBeChecked();
    expect(beef).not.toBeChecked();
    expect(chicken).not.toBeChecked();
    expect(seafood).not.toBeChecked();

    // Select Vegetarian -> auto-ticks Pork, Beef, Chicken, Seafood
    await user.click(screen.getByRole("radio", { name: "Vegetarian" }));
    expect(pork).toBeChecked();
    expect(beef).toBeChecked();
    expect(chicken).toBeChecked();
    expect(seafood).toBeChecked();
  });

  it("changes language via changeAppLanguage() (du-menu-scan:lang) and mirrors lang in prefs on save", async () => {
    const user = userEvent.setup();
    renderWithQuery(["/settings"]);

    const viRadio = screen.getByRole("radio", { name: "Tiếng Việt" });
    await user.click(viRadio);

    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi");
    expect(document.documentElement.lang).toBe("vi");

    await user.click(screen.getByRole("button", { name: "Lưu" }));

    const saved = readPrefs();
    expect(saved.lang).toBe("vi");
    expect(saved.onboarded).toBe(true);
  });

  it("saves preferences to localStorage, survives reload, and resetting storage returns to onboarding", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithQuery(["/r/main-hall/today", "/settings"], 1);

    await user.click(screen.getByRole("radio", { name: "Halal" }));
    await user.click(screen.getByRole("checkbox", { name: /Nuts/i }));
    await user.click(screen.getByRole("checkbox", { name: /Milk & egg/i }));
    await user.click(screen.getByRole("checkbox", { name: /Wheat/i }));
    await user.click(screen.getByRole("radio", { name: "Not spicy only" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Returns to previous screen
    expect(screen.getByTestId("location")).toHaveTextContent("/r/main-hall/today");

    const stored = readPrefs();
    expect(stored).toEqual({
      lang: "en",
      avoidTags: expect.arrayContaining(expandDietType("halal")),
      avoidAllergens: expect.arrayContaining([
        "peanut",
        "walnut",
        "pine_nut",
        "milk",
        "egg",
        "wheat",
      ]),
      spiceTolerance: 0,
      dietType: "halal",
      onboarded: true,
    });

    unmount();

    // Simulate reload of /settings -> form initializes from stored prefs
    const reloaded = renderWithQuery(["/settings"]);
    expect(screen.getByRole("radio", { name: "Halal" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Pork/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Nuts/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Milk & egg/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Wheat/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Not spicy only" })).toBeChecked();
    reloaded.unmount();

    // Clearing storage resets to onboarding (S1 routes to /welcome)
    window.localStorage.clear();
    expect(readPrefs()).toEqual(DEFAULT_PREFS);

    renderWithQuery(["/r/main-hall"]);
    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        `/welcome?next=${encodeURIComponent("/r/main-hall/today")}`,
      );
    });
  });

  it("updates S2/S3 warnings immediately upon saving without page reload", async () => {
    const user = userEvent.setup();
    const jeyuk = fixtureDishes.find((d) => d.id === "dish-jeyuk-bokkeum")!;

    function MockMenuScreen() {
      const prefs = usePrefs();
      const result = evaluate(jeyuk, prefs);
      return (
        <div>
          <span data-testid="warning-status">{result.status}</span>
          <Link to="/settings">Open Settings</Link>
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={["/menu"]}>
        <Routes>
          <Route path="/menu" element={<MockMenuScreen />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("warning-status")).toHaveTextContent("ok");

    await user.click(screen.getByRole("link", { name: "Open Settings" }));
    await user.click(screen.getByRole("checkbox", { name: /Pork/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByTestId("warning-status")).toHaveTextContent("avoid");
  });

  it.each([
    ["bad JSON", "{corrupt-json"],
    [
      "capitalized 'Halal' dietType",
      JSON.stringify({ ...DEFAULT_PREFS, dietType: "Halal", onboarded: true }),
    ],
    [
      "missing spiceTolerance",
      JSON.stringify({
        lang: "en",
        avoidTags: [],
        avoidAllergens: [],
        dietType: "none",
        onboarded: true,
      }),
    ],
  ])(
    "does not crash on corrupt localStorage (%s) and routes to S4 (/settings)",
    async (_, rawValue) => {
      window.localStorage.setItem(PREFS_STORAGE_KEY, rawValue);

      expect(() => readPrefs()).not.toThrow();
      expect(readPrefs().onboarded).toBe(false);

      const { unmount } = renderWithQuery(["/r/main-hall"]);
      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent(
          `/settings?next=${encodeURIComponent("/r/main-hall/today")}`,
        );
      });
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("My diet");
      unmount();
    },
  );
});
