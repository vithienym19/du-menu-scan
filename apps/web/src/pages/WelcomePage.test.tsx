import { createApi, DEFAULT_PREFS, LANGUAGES } from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppRoutes } from "../App";
import { api } from "../lib/api";
import { changeAppLanguage, LANGUAGE_STORAGE_KEY } from "../lib/i18n";
import * as prefsModule from "../lib/prefs";
import { isValidTodayPath, resolveWelcomeNextPath } from "../lib/safePath";

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderAt(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("resolveWelcomeNextPath / isValidTodayPath", () => {
  it.each(["/r/main-hall/today", "/r/dorm/today", "/r/eng-1/today"])(
    "accepts valid /r/:code/today path: %s",
    (path) => {
      expect(isValidTodayPath(path)).toBe(true);
      expect(resolveWelcomeNextPath(path)).toBe(path);
    },
  );

  it.each([
    ["//evil.com"],
    ["https://evil.com/r/main-hall/today"],
    ["/settings"],
    ["/r/BAD CODE/today"],
    ["/r/main-hall"],
    ["/r/main-hall/today/extra"],
    ["/r/main-hall/today?foo=bar"],
    [""],
    [null],
  ])("rejects invalid or unsafe next param %s and falls back to /", (path) => {
    expect(isValidTodayPath(path)).toBe(false);
    expect(resolveWelcomeNextPath(path)).toBe("/");
  });
});

describe("UI-09 S0 Welcome", () => {
  const mockApi = createApi({ baseUrl: "", useMock: true });

  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
    vi.spyOn(api, "getCafeteria").mockImplementation((code) => mockApi.getCafeteria(code));
    vi.spyOn(api, "getTodayMenu").mockImplementation((code) => mockApi.getTodayMenu(code));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all 7 languages from LANGUAGES with current pre-selected (aria-pressed) and >= 44px touch targets", () => {
    renderAt("/welcome?next=/r/main-hall/today");

    expect(screen.getByText("See what's in today's menu")).toBeInTheDocument();
    expect(screen.getByText("Choose your language")).toBeInTheDocument();

    const langRegion = screen.getByRole("region", { name: "Choose your language" });
    const buttons = within(langRegion).getAllByRole("button");
    expect(buttons).toHaveLength(LANGUAGES.length);

    for (const lang of LANGUAGES) {
      const btn = within(langRegion).getByRole("button", { name: lang.nativeName });
      expect(btn).toHaveClass("min-h-11");
      expect(btn).toHaveAttribute("aria-pressed", lang.code === "en" ? "true" : "false");
    }

    const setDietLink = screen.getByRole("link", { name: "Set my diet" });
    expect(setDietLink).toHaveClass("min-h-11");

    const skipButton = screen.getByRole("button", { name: "Skip for now" });
    expect(skipButton).toHaveClass("min-h-11");
  });

  it("switches language via changeAppLanguage() when a language button is clicked", async () => {
    const user = userEvent.setup();
    renderAt("/welcome");

    const langRegion = screen.getByRole("region", { name: "Choose your language" });
    await user.click(within(langRegion).getByRole("button", { name: "Tiếng Việt" }));

    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi");
    expect(document.documentElement.lang).toBe("vi");
    expect(within(langRegion).getByRole("button", { name: "Tiếng Việt" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(langRegion).getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("link", { name: "Thiết lập chế độ ăn" })).toBeInTheDocument();
  });

  it("links 'Set my diet' to /settings?next=<validated next>", () => {
    const valid = renderAt("/welcome?next=%2Fr%2Fmain-hall%2Ftoday");
    expect(screen.getByRole("link", { name: "Set my diet" })).toHaveAttribute(
      "href",
      "/settings?next=%2Fr%2Fmain-hall%2Ftoday",
    );
    valid.unmount();

    renderAt("/welcome?next=//evil.com");
    expect(screen.getByRole("link", { name: "Set my diet" })).toHaveAttribute(
      "href",
      "/settings?next=%2F",
    );
  });

  it("writes onboarded DEFAULT_PREFS via writePrefs() on Skip and navigates to validated next", async () => {
    const user = userEvent.setup();
    const writeSpy = vi.spyOn(prefsModule, "writePrefs");

    renderAt("/welcome?next=%2Fr%2Fmain-hall%2Ftoday");

    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(writeSpy).toHaveBeenCalledWith({
      ...DEFAULT_PREFS,
      lang: "en",
      onboarded: true,
    });
    expect(prefsModule.readPrefs()).toEqual({
      ...DEFAULT_PREFS,
      lang: "en",
      onboarded: true,
    });
    expect(screen.getByTestId("location")).toHaveTextContent("/r/main-hall/today");
  });

  it("navigates to / on Skip when ?next= is invalid or missing", async () => {
    const user = userEvent.setup();

    renderAt("/welcome?next=/settings");
    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(prefsModule.readPrefs().onboarded).toBe(true);
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  it("immediately redirects returning onboarded visitors away from S0 to validated next", () => {
    prefsModule.writePrefs({
      ...DEFAULT_PREFS,
      onboarded: true,
    });

    const withValidNext = renderAt("/welcome?next=%2Fr%2Fdorm%2Ftoday");
    expect(screen.queryByText("See what's in today's menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/r/dorm/today");
    withValidNext.unmount();

    renderAt("/welcome?next=https://evil.com/r/dorm/today");
    expect(screen.queryByText("See what's in today's menu")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});
