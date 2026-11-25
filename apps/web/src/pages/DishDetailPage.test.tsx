import {
  createApi,
  DEFAULT_PREFS,
  fixtureDishes,
  type DishView,
  type Prefs,
} from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import { api } from "../lib/api";
import { changeAppLanguage } from "../lib/i18n";
import { PREFS_STORAGE_KEY } from "../lib/prefs";

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderDishRoute(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRoutes />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setPrefs(overrides: Partial<Prefs>) {
  const prefs: Prefs = {
    ...DEFAULT_PREFS,
    ...overrides,
  };
  window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

describe("UI-07 S3 Dish detail (safety-critical)", () => {
  const mockApi = createApi({ baseUrl: "", useMock: true });

  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
    vi.spyOn(api, "getDish").mockImplementation((id) => mockApi.getDish(id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(fixtureDishes)(
    "renders fixture dish $id with the mandatory safety footer always visible",
    async (dish) => {
      renderDishRoute(`/dish/${dish.id}?date=2026-11-25`);

      await waitFor(() => {
        expect(screen.getByRole("heading", { level: 2, name: dish.name.ko })).toBeInTheDocument();
      });

      const footer = screen.getByTestId("safety-footer");
      expect(footer).toBeVisible();
      expect(
        within(footer).getByText("Please confirm with staff if you have a severe allergy."),
      ).toBeInTheDocument();

      if (dish.verifiedAt) {
        expect(within(footer).getByText(/Last verified/i)).toBeInTheDocument();
      } else {
        expect(within(footer).getByText("Not verified yet")).toBeInTheDocument();
      }

      // Every dish renders diet rows, spice level, and Back to menu button
      expect(screen.getByTestId("diet-row-halal")).toBeInTheDocument();
      expect(screen.getByTestId("diet-row-vegetarian")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Back to menu" })).toBeInTheDocument();
    },
  );

  it("renders dish-sundubu-jjigae (unverified) with grey Not verified banner, never OK, unknown diet info and neverVerified footer", async () => {
    renderDishRoute("/dish/dish-sundubu-jjigae");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "순두부찌개" })).toBeInTheDocument();
    });

    expect(screen.queryByText("OK for you")).not.toBeInTheDocument();

    const banner = screen.getByTestId("warning-banner-unverified");
    expect(within(banner).getByText("Not verified")).toBeInTheDocument();
    expect(within(banner).getByText("Ingredients have not been verified yet")).toBeInTheDocument();

    const halalRow = screen.getByTestId("diet-row-halal");
    const vegRow = screen.getByTestId("diet-row-vegetarian");
    expect(halalRow).toHaveAttribute("data-diet-value", "unknown");
    expect(vegRow).toHaveAttribute("data-diet-value", "unknown");
    expect(within(halalRow).getByText("Unknown")).toBeInTheDocument();
    expect(within(vegRow).getByText("Unknown")).toBeInTheDocument();
    expect(screen.queryByText("Suitable")).not.toBeInTheDocument();

    const footer = screen.getByTestId("safety-footer");
    expect(within(footer).getByText("Not verified yet")).toBeInTheDocument();
    expect(
      within(footer).getByText("Please confirm with staff if you have a severe allergy."),
    ).toBeInTheDocument();
  });

  it("shows spice reason inside the unverified banner when unverified dish exceeds spice tolerance", async () => {
    setPrefs({ spiceTolerance: 1, onboarded: true });
    renderDishRoute("/dish/dish-sundubu-jjigae");

    await waitFor(() => {
      expect(screen.getByTestId("warning-banner-unverified")).toBeInTheDocument();
    });

    const banner = screen.getByTestId("warning-banner-unverified");
    expect(within(banner).getByText("Ingredients have not been verified yet")).toBeInTheDocument();
    expect(within(banner).getByText("Spicier than your setting")).toBeInTheDocument();
  });

  it("shows BOTH the Avoid banner and the Not verified note when evaluate() returns avoid with unverified: true", async () => {
    const unverifiedPorkDish: DishView = {
      id: "dish-unverified-pork",
      name: { ko: "미확인 돼지국밥", en: "Unverified pork soup" },
      photoUrl: null,
      spiceLevel: 1,
      ingredients: [{ name: { ko: "돼지고기", en: "Pork" }, isMain: true, isHidden: false }],
      allergens: [{ code: "pork", name: { ko: "돼지고기", en: "Pork" } }],
      dietTags: ["pork"],
      allergensConfirmed: false,
      verifiedAt: null,
    };
    vi.spyOn(api, "getDish").mockResolvedValueOnce(unverifiedPorkDish);
    setPrefs({ dietType: "halal", onboarded: true });

    renderDishRoute("/dish/dish-unverified-pork");

    await waitFor(() => {
      expect(screen.getByTestId("warning-banner-avoid")).toBeInTheDocument();
    });

    const avoidBanner = screen.getByTestId("warning-banner-avoid");
    expect(within(avoidBanner).getByText("Avoid")).toBeInTheDocument();
    expect(
      within(avoidBanner).getByText("Contains Pork — you chose to avoid it"),
    ).toBeInTheDocument();

    const unverifiedNote = screen.getByTestId("warning-banner-unverified-note");
    expect(within(unverifiedNote).getByText("Not verified")).toBeInTheDocument();
    expect(
      within(unverifiedNote).getByText("Ingredients have not been verified yet"),
    ).toBeInTheDocument();

    expect(screen.queryByText("OK for you")).not.toBeInTheDocument();
    expect(screen.getByTestId("diet-row-halal")).toHaveAttribute("data-diet-value", "false");
    expect(screen.getByTestId("diet-row-vegetarian")).toHaveAttribute("data-diet-value", "false");
  });

  it("shows explicit OK badge (showOk) and suitable diet compatibility on a verified vegetarian dish", async () => {
    setPrefs({ spiceTolerance: 4, onboarded: true });
    renderDishRoute("/dish/dish-yachae-bibimbap");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "야채비빔밥" })).toBeInTheDocument();
    });

    expect(screen.getByText("OK for you")).toBeInTheDocument();
    expect(screen.queryByTestId("warning-banner-avoid")).not.toBeInTheDocument();
    expect(screen.queryByTestId("warning-banner-caution")).not.toBeInTheDocument();
    expect(screen.queryByTestId("warning-banner-unverified")).not.toBeInTheDocument();

    expect(screen.getByTestId("diet-row-halal")).toHaveAttribute("data-diet-value", "true");
    expect(screen.getByTestId("diet-row-vegetarian")).toHaveAttribute("data-diet-value", "true");
    expect(screen.getAllByText("Suitable")).toHaveLength(2);
  });

  it("shows Caution banner with spice reason when dish is spicier than tolerance", async () => {
    setPrefs({ spiceTolerance: 1, onboarded: true });
    renderDishRoute("/dish/dish-yachae-bibimbap");

    await waitFor(() => {
      expect(screen.getByTestId("warning-banner-caution")).toBeInTheDocument();
    });

    const banner = screen.getByTestId("warning-banner-caution");
    expect(within(banner).getByText("Caution")).toBeInTheDocument();
    expect(within(banner).getByText("Spicier than your setting")).toBeInTheDocument();
  });

  it("renders tag, allergen and spice reasons from evaluate() with i18n keys", async () => {
    setPrefs({
      avoidTags: ["pork"],
      avoidAllergens: ["soy"],
      spiceTolerance: 1,
      onboarded: true,
    });
    renderDishRoute("/dish/dish-jeyuk-bokkeum");

    await waitFor(() => {
      expect(screen.getByTestId("warning-banner-avoid")).toBeInTheDocument();
    });

    const banner = screen.getByTestId("warning-banner-avoid");
    expect(within(banner).getByText("Contains Pork — you chose to avoid it")).toBeInTheDocument();
    expect(
      within(banner).getByText("Contains Soybean — you chose to avoid it"),
    ).toBeInTheDocument();
    expect(within(banner).getByText("Spicier than your setting")).toBeInTheDocument();
  });

  it("shows hidden ingredients, placeholder photo when photoUrl is null, and collapsible other languages", async () => {
    const user = userEvent.setup();
    renderDishRoute("/dish/dish-doenjang-jjigae?date=2026-11-25");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "된장찌개" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("dish-photo-placeholder")).toBeInTheDocument();
    expect(screen.getByText("Anchovy broth")).toBeInTheDocument();
    expect(
      screen.getByText("Not obvious from the name, e.g. in the broth or sauce."),
    ).toBeInTheDocument();

    const summary = screen.getByText("Other languages");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");

    await user.click(summary);
    expect(details).toHaveAttribute("open");
    expect(screen.getByText("Tiếng Việt")).toBeInTheDocument();
    expect(screen.getByText("Canh tương đậu")).toBeInTheDocument();
    expect(screen.getByText("中文")).toBeInTheDocument();
    expect(screen.getByText("大酱汤")).toBeInTheDocument();
  });

  it("shows translation pending marker when localize() falls back (e.g. dish-donkkaseu in vi)", async () => {
    await changeAppLanguage("vi");
    renderDishRoute("/dish/dish-donkkaseu");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "돈까스" })).toBeInTheDocument();
    });

    expect(screen.getByTestId("translation-pending-name")).toHaveTextContent("Đang chờ bản dịch");
    expect(screen.getAllByText("Pork cutlet").length).toBeGreaterThan(0);
  });

  it("renders loading state before dish resolves", () => {
    vi.spyOn(api, "getDish").mockReturnValue(new Promise(() => {}));
    renderDishRoute("/dish/dish-doenjang-jjigae");

    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Loading…");
  });

  it("renders an ingredient flagged both main and hidden in both sections (dish-tteokbokki)", async () => {
    renderDishRoute("/dish/dish-tteokbokki");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "떡볶이" })).toBeInTheDocument();
    });

    expect(screen.getAllByText("Fish cake")).toHaveLength(2);
    expect(screen.getByText("Anchovy broth")).toBeInTheDocument();
  });

  it("distinguishes false (notSuitable) from null (dietUnknown) on the same unverified dish", async () => {
    const unverifiedAlcoholDish: DishView = {
      id: "dish-unverified-alcohol",
      name: { ko: "미확인 양념요리", en: "Unverified sauce dish" },
      photoUrl: null,
      spiceLevel: 0,
      ingredients: [{ name: { ko: "맛술", en: "Cooking wine" }, isMain: false, isHidden: true }],
      allergens: [],
      dietTags: ["alcohol"],
      allergensConfirmed: false,
      verifiedAt: null,
    };
    vi.spyOn(api, "getDish").mockResolvedValueOnce(unverifiedAlcoholDish);

    renderDishRoute("/dish/dish-unverified-alcohol");

    await waitFor(() => {
      expect(screen.getByTestId("diet-row-halal")).toBeInTheDocument();
    });

    const halalRow = screen.getByTestId("diet-row-halal");
    const vegRow = screen.getByTestId("diet-row-vegetarian");
    expect(halalRow).toHaveAttribute("data-diet-value", "false");
    expect(within(halalRow).getByText("Not suitable")).toBeInTheDocument();
    expect(vegRow).toHaveAttribute("data-diet-value", "unknown");
    expect(within(vegRow).getByText("Unknown")).toBeInTheDocument();
  });

  it("updates labels, warning reasons and safety footer when language is changed", async () => {
    setPrefs({ dietType: "halal", onboarded: true });
    await changeAppLanguage("ko");
    renderDishRoute("/dish/dish-jeyuk-bokkeum");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "제육볶음" })).toBeInTheDocument();
    });

    const banner = screen.getByTestId("warning-banner-avoid");
    expect(
      within(banner).getByText("돼지고기 포함 — 피하기로 설정한 재료예요"),
    ).toBeInTheDocument();

    const footer = screen.getByTestId("safety-footer");
    expect(within(footer).getByText(/최근 확인일/)).toBeInTheDocument();
    expect(
      within(footer).getByText("알레르기가 심하다면 직원에게 꼭 확인해 주세요."),
    ).toBeInTheDocument();
  });

  it("renders not-found state for unknown dishId and allows going back", async () => {
    const user = userEvent.setup();
    renderDishRoute("/dish/does-not-exist");

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "Page not found" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Back to menu" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/welcome");
  });

  it("renders error state with retry and recovers when retry succeeds", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getDish")
      .mockRejectedValueOnce(new Error("Network error"))
      .mockImplementationOnce((id) => mockApi.getDish(id));

    renderDishRoute("/dish/dish-doenjang-jjigae");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "된장찌개" })).toBeInTheDocument();
    });
  });
});
