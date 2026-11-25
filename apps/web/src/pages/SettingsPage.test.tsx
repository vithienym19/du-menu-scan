import { createApi, DEFAULT_PREFS, expandDietType, fixtureDishes } from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import { DishCard } from "../components/DishCard";
import { api } from "../lib/api";
import { changeAppLanguage, LANGUAGE_STORAGE_KEY } from "../lib/i18n";
import { PREFS_STORAGE_KEY, readPrefs, readPrefsWithMeta, writePrefs } from "../lib/prefs";
import { normalizeSpiceOption, SettingsPage } from "./SettingsPage";

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

  it("auto-ticks and disables implied tags with 'Included in your diet type' for Halal and Vegetarian, and keeps them ticked & editable when switched back to No restriction (D-022)", async () => {
    const user = userEvent.setup();
    renderWithQuery(["/settings"]);

    const pork = screen.getByRole("checkbox", { name: /Pork/i });
    const beef = screen.getByRole("checkbox", { name: /Beef/i });
    const chicken = screen.getByRole("checkbox", { name: /Chicken/i });
    const seafood = screen.getByRole("checkbox", { name: /Seafood/i });

    // Select Halal -> Pork is checked and disabled with hint; trying to untick Pork does nothing
    await user.click(screen.getByRole("radio", { name: "Halal" }));
    expect(pork).toBeChecked();
    expect(pork).toBeDisabled();
    expect(pork.closest("label")).toHaveTextContent("Included in your diet type");
    expect(beef).not.toBeChecked();
    expect(beef).not.toBeDisabled();
    expect(chicken).not.toBeChecked();
    expect(chicken).not.toBeDisabled();
    expect(seafood).not.toBeChecked();
    expect(seafood).not.toBeDisabled();

    await user.click(pork);
    expect(pork).toBeChecked();

    // Switch Halal -> No restriction: Pork stays ticked and becomes editable again
    await user.click(screen.getByRole("radio", { name: "No restriction" }));
    expect(pork).toBeChecked();
    expect(pork).not.toBeDisabled();
    expect(screen.queryByText("Included in your diet type")).not.toBeInTheDocument();

    // Select Vegetarian -> Pork, Beef, Chicken, Seafood are all checked and disabled with hint
    await user.click(screen.getByRole("radio", { name: "Vegetarian" }));
    for (const checkbox of [pork, beef, chicken, seafood]) {
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();
      expect(checkbox.closest("label")).toHaveTextContent("Included in your diet type");
    }
    expect(screen.getAllByText("Included in your diet type")).toHaveLength(4);

    // Switch Vegetarian -> No restriction: all 4 stay ticked so nothing is silently dropped, and become editable
    await user.click(screen.getByRole("radio", { name: "No restriction" }));
    for (const checkbox of [pork, beef, chicken, seafood]) {
      expect(checkbox).toBeChecked();
      expect(checkbox).not.toBeDisabled();
    }
    expect(screen.queryByText("Included in your diet type")).not.toBeInTheDocument();

    // User can now untick Seafood and save; saved prefs match what is shown on screen
    await user.click(seafood);
    expect(seafood).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(readPrefs().dietType).toBe("none");
    expect(readPrefs().avoidTags).toEqual(["pork", "beef", "chicken"]);
  });

  it("preserves stored avoidTags not shown as checkboxes (e.g. alcohol) on save", async () => {
    const user = userEvent.setup();
    writePrefs({
      ...DEFAULT_PREFS,
      avoidTags: ["alcohol", "pork"],
      avoidAllergens: ["soy"],
      dietType: "none",
      spiceTolerance: 4,
      onboarded: true,
    });

    renderWithQuery(["/settings"]);

    await user.click(screen.getByRole("checkbox", { name: /Beef/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const saved = readPrefs();
    expect(saved.avoidTags).toEqual(expect.arrayContaining(["alcohol", "pork", "beef"]));
    expect(saved.avoidAllergens).toEqual(expect.arrayContaining(["soy"]));
  });

  it("rounds stored spiceTolerance values DOWN to radio options (0,1 -> 0; 2,3 -> 2; 4 -> 4) so saving never loosens a tolerance (D-023)", async () => {
    expect(normalizeSpiceOption(0)).toBe(0);
    expect(normalizeSpiceOption(1)).toBe(0);
    expect(normalizeSpiceOption(2)).toBe(2);
    expect(normalizeSpiceOption(3)).toBe(2);
    expect(normalizeSpiceOption(4)).toBe(4);

    const user = userEvent.setup();

    // Stored spiceTolerance = 1 -> shown as "Not spicy only" (0) and saved as 0
    writePrefs({ ...DEFAULT_PREFS, spiceTolerance: 1, dietType: "none", onboarded: true });
    const first = renderWithQuery(["/settings"]);
    expect(screen.getByRole("radio", { name: "Not spicy only" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(readPrefs().spiceTolerance).toBe(0);
    first.unmount();

    // Stored spiceTolerance = 3 -> shown as "A little spicy" (2) and saved as 2
    writePrefs({ ...DEFAULT_PREFS, spiceTolerance: 3, dietType: "none", onboarded: true });
    const second = renderWithQuery(["/settings"]);
    expect(screen.getByRole("radio", { name: "A little spicy" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(readPrefs().spiceTolerance).toBe(2);
    second.unmount();
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

  it("updates S2/S3 warnings and DishCard immediately upon saving without page reload", async () => {
    const user = userEvent.setup();
    const jeyuk = fixtureDishes.find((d) => d.id === "dish-jeyuk-bokkeum")!;

    function MockMenuScreen() {
      return (
        <div>
          <DishCard dish={jeyuk} price={5500} />
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

    expect(screen.getByTestId("dish-card-dish-jeyuk-bokkeum")).toHaveAttribute("data-status", "ok");

    await user.click(screen.getByRole("link", { name: "Open Settings" }));
    await user.click(screen.getByRole("checkbox", { name: /Pork/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByTestId("dish-card-dish-jeyuk-bokkeum")).toHaveAttribute(
      "data-status",
      "avoid",
    );
  });

  it.each([
    ["bad JSON", "{corrupt-json"],
    ["literal JSON null", "null"],
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
    async (label, rawValue) => {
      window.localStorage.setItem(PREFS_STORAGE_KEY, rawValue);

      expect(() => readPrefs()).not.toThrow();
      const { prefs, hasStoredData } = readPrefsWithMeta();
      expect(hasStoredData).toBe(true);
      expect(prefs.onboarded).toBe(false);
      if (label === "literal JSON null" || label === "bad JSON") {
        expect(prefs.spiceTolerance).toBe(0);
        expect(prefs.avoidTags).toEqual(
          expect.arrayContaining(["pork", "alcohol", "beef", "chicken", "seafood"]),
        );
      }

      const { unmount } = renderWithQuery(["/r/main-hall"]);
      await waitFor(() => {
        expect(screen.getByTestId("location")).toHaveTextContent(
          `/settings?next=${encodeURIComponent("/r/main-hall/today")}`,
        );
      });
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("My diet");
      unmount();

      // Also redirects S2 and S3 via useRequireOnboarding()
      for (const directRoute of ["/r/main-hall/today", "/dish/dish-jeyuk-bokkeum"]) {
        const directRender = renderWithQuery([directRoute]);
        await waitFor(() => {
          expect(screen.getByTestId("location")).toHaveTextContent(
            `/settings?next=${encodeURIComponent(directRoute)}`,
          );
        });
        directRender.unmount();
      }
    },
  );
});
