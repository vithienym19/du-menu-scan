import { LANGUAGES } from "@du-menu-scan/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { AppRoutes } from "./App";
import { changeAppLanguage, detectInitialLanguage, LANGUAGE_STORAGE_KEY } from "./lib/i18n";

function renderAt(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UI-01 App shell, theme, routing and language picker", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
  });

  it("renders placeholder pages for all required routes", () => {
    const routes = [
      { path: "/", heading: "See what's in today's menu" },
      { path: "/welcome", heading: "See what's in today's menu" },
      { path: "/r/main-hall", heading: "Loading…" },
      { path: "/r/main-hall/today", heading: "Today's menu" },
      { path: "/dish/dish-kimchi-jjigae", heading: "About this dish" },
      { path: "/settings", heading: "My diet" },
      { path: "/unknown-route", heading: "Page not found" },
    ];

    for (const route of routes) {
      const { unmount } = renderAt(route.path);
      expect(screen.getAllByText(route.heading).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it("opens LanguagePicker with all languages by native name, marks current with aria-current, and updates header, <html lang> and localStorage", async () => {
    const user = userEvent.setup();
    renderAt("/r/main-hall/today");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Today's menu");

    const langButton = screen.getByRole("button", { name: /Language: English/i });
    await user.click(langButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(document.body).toHaveClass("overflow-hidden");

    for (const lang of LANGUAGES) {
      const btn = within(dialog).getByRole("button", { name: lang.nativeName });
      expect(btn).toBeInTheDocument();
      if (lang.code === "en") {
        expect(btn).toHaveAttribute("aria-current", "true");
        expect(btn).toHaveFocus();
      } else {
        expect(btn).not.toHaveAttribute("aria-current");
      }
    }

    await user.click(within(dialog).getByRole("button", { name: "Tiếng Việt" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body).not.toHaveClass("overflow-hidden");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Menu hôm nay");
    expect(document.documentElement.lang).toBe("vi");
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("vi");
    expect(detectInitialLanguage()).toBe("vi");
  });

  it("auto-detects browser language when localStorage is empty", () => {
    window.localStorage.clear();
    const originalLanguages = window.navigator.languages;
    Object.defineProperty(window.navigator, "languages", {
      value: ["ko-KR", "en-US"],
      configurable: true,
    });
    expect(detectInitialLanguage()).toBe("ko");
    Object.defineProperty(window.navigator, "languages", {
      value: originalLanguages,
      configurable: true,
    });
  });

  it("applies leading-relaxed on body when Nepali (ne) is selected", async () => {
    const user = userEvent.setup();
    renderAt("/settings");

    await user.click(screen.getByRole("button", { name: /Language: English/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "नेपाली" }));

    expect(document.documentElement.lang).toBe("ne");
    expect(document.body.classList.contains("leading-relaxed")).toBe(true);
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ne");
  });

  it("traps focus inside LanguagePicker with Tab and Shift+Tab, and returns focus on Escape or Close", async () => {
    const user = userEvent.setup();
    renderAt("/settings");

    const langButton = screen.getByRole("button", { name: /Language: English/i });
    await user.click(langButton);

    const dialog = screen.getByRole("dialog");
    const closeButton = within(dialog).getByRole("button", { name: "Close" });
    const englishButton = within(dialog).getByRole("button", { name: "English" });
    const lastLang = LANGUAGES[LANGUAGES.length - 1]!;
    const lastLangButton = within(dialog).getByRole("button", { name: lastLang.nativeName });

    // Opening the sheet moves focus to the currently selected language button
    expect(englishButton).toHaveFocus();

    // Focus the last button, then Tab wraps to the first button (Close)
    lastLangButton.focus();
    expect(lastLangButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    // Shift+Tab from the first button wraps to the last button
    await user.tab({ shift: true });
    expect(lastLangButton).toHaveFocus();

    // Escape closes the dialog and returns focus to the language button
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(langButton).toHaveFocus();

    // Re-open and close via Close button, focus also returns to the language button
    await user.click(langButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(langButton).toHaveFocus();
  });
});
