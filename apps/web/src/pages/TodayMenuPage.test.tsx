import { createApi, DEFAULT_PREFS, fixtureMenus, type Prefs } from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import { api } from "../lib/api";
import { changeAppLanguage } from "../lib/i18n";
import { menuCacheKey, writeCachedMenu } from "../lib/menuCache";
import { PREFS_STORAGE_KEY, writePrefs } from "../lib/prefs";

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderMenuRoute(initialEntries: string[] = ["/r/main-hall/today"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function setStoredPrefs(overrides: Partial<Prefs>) {
  const prefs: Prefs = {
    ...DEFAULT_PREFS,
    onboarded: true,
    ...overrides,
  };
  window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

function setNavigatorOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    value: online,
    configurable: true,
  });
}

describe("UI-06 S2 Today's menu", () => {
  const mockApi = createApi({ baseUrl: "", useMock: true });

  beforeEach(async () => {
    window.localStorage.clear();
    setNavigatorOnline(true);
    await changeAppLanguage("en");
    vi.spyOn(api, "getTodayMenu").mockImplementation((code) => mockApi.getTodayMenu(code));
    vi.spyOn(api, "getDish").mockImplementation((id) => mockApi.getDish(id));
    vi.spyOn(api, "listCafeterias").mockImplementation(() => mockApi.listCafeterias());
  });

  afterEach(() => {
    setNavigatorOnline(true);
    vi.restoreAllMocks();
  });

  it("renders loading skeleton before menu resolves", () => {
    vi.spyOn(api, "getTodayMenu").mockReturnValue(new Promise(() => {}));
    renderMenuRoute(["/r/main-hall/today"]);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Today's menu");
    expect(within(screen.getByRole("main")).getByRole("status")).toHaveTextContent("Loading…");
  });

  it("renders published menu (main-hall) with sections per corner, date, meal, lazy images and gear link to S4", async () => {
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Student Union Cafeteria",
      );
    });

    expect(screen.getByText("Lunch")).toBeInTheDocument();
    const timeEl = document.querySelector('time[datetime="2026-11-25"]');
    expect(timeEl).not.toBeNull();

    const settingsLink = screen.getByRole("link", { name: "My diet" });
    expect(settingsLink).toHaveAttribute("href", "/settings");
    expect(settingsLink).toHaveClass("min-h-11", "min-w-11");

    expect(screen.getByRole("heading", { level: 2, name: "Korean" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Snacks & Noodles" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Shared side dishes" }),
    ).toBeInTheDocument();

    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img).toHaveAttribute("loading", "lazy");
    }

    // Menu is cached in localStorage for offline resilience
    expect(window.localStorage.getItem(menuCacheKey("main-hall"))).not.toBeNull();
  });

  it("sorts each corner OK -> Caution -> Not verified -> Avoid (D-017) and marks Avoid with both border and text", async () => {
    setStoredPrefs({ avoidTags: ["pork"], spiceTolerance: 1 });
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("corner-section-corner-korean")).toBeInTheDocument();
    });

    const koreanSection = screen.getByTestId("corner-section-corner-korean");
    const cards = within(koreanSection).getAllByRole("article");
    const ids = cards.map((card) => card.getAttribute("data-testid"));
    const statuses = cards.map((card) => card.getAttribute("data-status"));

    expect(ids).toEqual([
      "dish-card-dish-doenjang-jjigae",
      "dish-card-dish-miyeokguk",
      "dish-card-dish-yachae-bibimbap",
      "dish-card-dish-sundubu-jjigae",
      "dish-card-dish-jeyuk-bokkeum",
    ]);
    expect(statuses).toEqual(["ok", "ok", "caution", "unverified", "avoid"]);

    const avoidCard = screen.getByTestId("dish-card-dish-jeyuk-bokkeum");
    expect(avoidCard.className).toContain("ring-avoid-line");
    expect(within(avoidCard).getByText("Avoid")).toBeInTheDocument();
  });

  it("applies each filter chip (Not spicy, No pork, Vegetarian), hides unverified dishes when active, and supports no-results + Clear filters", async () => {
    const user = userEvent.setup();
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("dish-card-dish-sundubu-jjigae")).toBeInTheDocument();
    });

    const notSpicyBtn = screen.getByRole("button", { name: "Not spicy" });
    const noPorkBtn = screen.getByRole("button", { name: "No pork" });
    const vegetarianBtn = screen.getByRole("button", { name: "Vegetarian" });

    // 1) Not spicy: only verified spiceLevel === 0 dishes
    await user.click(notSpicyBtn);
    expect(notSpicyBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("dish-card-dish-miyeokguk")).toBeInTheDocument();
    expect(screen.getByTestId("dish-card-dish-udon")).toBeInTheDocument();
    expect(screen.getByTestId("dish-card-dish-donkkaseu")).toBeInTheDocument();
    expect(screen.getByTestId("dish-card-dish-japchae")).toBeInTheDocument();
    expect(screen.queryByTestId("dish-card-dish-doenjang-jjigae")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dish-card-dish-sundubu-jjigae")).not.toBeInTheDocument();

    // Clear Not spicy
    await user.click(notSpicyBtn);
    expect(screen.getByTestId("dish-card-dish-sundubu-jjigae")).toBeInTheDocument();

    // 2) No pork: hides pork dishes (incl. hidden pork in japchae) and unverified sundubu
    await user.click(noPorkBtn);
    expect(screen.queryByTestId("dish-card-dish-jeyuk-bokkeum")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dish-card-dish-donkkaseu")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dish-card-dish-japchae")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dish-card-dish-sundubu-jjigae")).not.toBeInTheDocument();
    expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();
    expect(screen.getByTestId("dish-card-dish-yachae-bibimbap")).toBeInTheDocument();

    // Clear No pork
    await user.click(noPorkBtn);

    // 3) Vegetarian: only verified meat/seafood-free dish (yachae-bibimbap); empty corners omitted
    await user.click(vegetarianBtn);
    expect(screen.getByTestId("dish-card-dish-yachae-bibimbap")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.queryByTestId("corner-section-corner-snack")).not.toBeInTheDocument();
    expect(screen.queryByTestId("corner-section-corner-side")).not.toBeInTheDocument();

    // 4) Combine Vegetarian + Not spicy -> no-results state + Clear filters button
    await user.click(notSpicyBtn);
    const noResults = screen.getByTestId("menu-no-results-state");
    expect(within(noResults).getByText("No dishes match these filters.")).toBeInTheDocument();

    await user.click(within(noResults).getByRole("button", { name: "Clear filters" }));
    expect(notSpicyBtn).toHaveAttribute("aria-pressed", "false");
    expect(vegetarianBtn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getAllByRole("article")).toHaveLength(10);
  });

  it("links each DishCard to /dish/:dishId?date=... with router state so S3 Back to menu returns to this menu", async () => {
    const user = userEvent.setup();
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();
    });

    const card = screen.getByTestId("dish-card-dish-doenjang-jjigae");
    const link = card.closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/dish/dish-doenjang-jjigae?date=2026-11-25");

    await user.click(link!);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/dish/dish-doenjang-jjigae?date=2026-11-25",
      );
    });
    expect(screen.getByRole("heading", { level: 2, name: "된장찌개" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to menu" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/r/main-hall/today");
    });
  });

  it("updates warnings and sort order immediately via usePrefs() when saving S4 or calling writePrefs without reload", async () => {
    const user = userEvent.setup();
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("dish-card-dish-jeyuk-bokkeum")).toHaveAttribute(
        "data-status",
        "ok",
      );
    });

    // Live update in place when writePrefs is called without remount
    act(() => {
      writePrefs({
        ...DEFAULT_PREFS,
        avoidTags: ["pork"],
        dietType: "none",
        spiceTolerance: 4,
      });
    });

    expect(screen.getByTestId("dish-card-dish-jeyuk-bokkeum")).toHaveAttribute(
      "data-status",
      "avoid",
    );

    const koreanCardsAfterWrite = within(
      screen.getByTestId("corner-section-corner-korean"),
    ).getAllByRole("article");
    expect(koreanCardsAfterWrite[koreanCardsAfterWrite.length - 1]).toHaveAttribute(
      "data-testid",
      "dish-card-dish-jeyuk-bokkeum",
    );

    // Round-trip through S4 via gear button: untick Pork and save -> jeyuk returns to OK
    await user.click(screen.getByRole("link", { name: "My diet" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/settings");

    await user.click(screen.getByRole("checkbox", { name: /Pork/i }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/r/main-hall/today");
    });
    expect(screen.getByTestId("dish-card-dish-jeyuk-bokkeum")).toHaveAttribute("data-status", "ok");
  });

  it("renders empty state with opening hours for dorm fixture", async () => {
    renderMenuRoute(["/r/dorm/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("menu-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dormitory Cafeteria");
    const emptySection = screen.getByTestId("menu-empty-state");
    expect(within(emptySection).getByText("Menu not available yet")).toBeInTheDocument();
    expect(
      within(emptySection).getByText(
        "Today's menu hasn't been published. Please check again later.",
      ),
    ).toBeInTheDocument();
    expect(within(emptySection).getByText("Opening hours")).toBeInTheDocument();
    expect(within(emptySection).getByText("11:30-13:00")).toBeInTheDocument();
    expect(within(emptySection).getByText("17:30-19:00")).toBeInTheDocument();
  });

  it("renders closed state for engineering fixture", async () => {
    renderMenuRoute(["/r/engineering/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("menu-closed-state")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Engineering Cafeteria");
    const closedSection = screen.getByTestId("menu-closed-state");
    expect(within(closedSection).getByText("Closed today")).toBeInTheDocument();
    expect(within(closedSection).getByText("This cafeteria is closed today.")).toBeInTheDocument();
    expect(within(closedSection).getByText("11:30-13:30")).toBeInTheDocument();
  });

  it("shows offline banner over the loaded menu when the browser goes offline and hides it on reconnect", async () => {
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByTestId("offline-banner")).toHaveTextContent(
      "You're offline. This menu may be outdated.",
    );
    expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
  });

  it("falls back to the last cached menu with offline notice and retry when fetch fails", async () => {
    const user = userEvent.setup();
    writeCachedMenu("main-hall", fixtureMenus["main-hall"]!);
    vi.spyOn(api, "getTodayMenu")
      .mockRejectedValueOnce(new Error("Network offline"))
      .mockImplementationOnce((code) => mockApi.getTodayMenu(code));

    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("offline-banner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("offline-banner")).toHaveTextContent(
      "You're offline. This menu may be outdated.",
    );
    expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();

    await user.click(
      within(screen.getByTestId("offline-banner")).getByRole("button", { name: "Try again" }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("offline-banner")).not.toBeInTheDocument();
    });
  });

  it("renders cached menu immediately when starting offline", () => {
    writeCachedMenu("main-hall", fixtureMenus["main-hall"]!);
    setNavigatorOnline(false);
    vi.spyOn(api, "getTodayMenu").mockReturnValue(new Promise(() => {}));

    renderMenuRoute(["/r/main-hall/today"]);

    expect(screen.getByTestId("offline-banner")).toHaveTextContent(
      "You're offline. This menu may be outdated.",
    );
    expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();
  });

  it("renders error state with retry when fetch fails with no cached menu and recovers on retry", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "getTodayMenu")
      .mockRejectedValueOnce(new Error("Server unavailable"))
      .mockImplementationOnce((code) => mockApi.getTodayMenu(code));

    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't load the menu. Check your connection and try again.",
    );

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByTestId("dish-card-dish-doenjang-jjigae")).toBeInTheDocument();
    });
  });

  it("renders invalid cafeteria state with cafeteria links when getTodayMenu returns null", async () => {
    renderMenuRoute(["/r/unknown-hall/today"]);

    await waitFor(() => {
      expect(screen.getByText("We couldn't find this cafeteria")).toBeInTheDocument();
    });

    expect(await screen.findByRole("link", { name: "Student Union Cafeteria" })).toHaveAttribute(
      "href",
      "/r/main-hall/today",
    );
  });

  it("redirects to /settings via useRequireOnboarding when stored prefs are corrupt", async () => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, "{broken-json");
    renderMenuRoute(["/r/main-hall/today"]);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        `/settings?next=${encodeURIComponent("/r/main-hall/today")}`,
      );
    });
  });
});
