import { LANGUAGES } from "@du-menu-scan/shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { AppRoutes } from "./App";
import {
  changeAppLanguage,
  detectInitialLanguage,
  LANGUAGE_STORAGE_KEY,
  PREFS_STORAGE_KEY,
} from "./lib/i18n";

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe("UI-01 App shell, theme, routing and language picker", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
  });

  it("renders placeholder pages for all required routes", () => {
    const routes = [
      { path: "/welcome", heading: "See what's in today's menu" },
      { path: "/r/main-hall", heading: "Choose a cafeteria" },
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

  it("opens LanguagePicker with all languages by native name and updates header, <html lang> and localStorage", () => {
    renderAt("/r/main-hall/today");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Today's menu");

    const langButton = screen.getByRole("button", { name: /Language: English/i });
    fireEvent.click(langButton);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    for (const lang of LANGUAGES) {
      expect(screen.getByRole("option", { name: lang.nativeName })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("option", { name: "Tiếng Việt" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

  it("applies leading-relaxed on body when Nepali (ne) is selected and syncs existing prefs", () => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ lang: "en", onboarded: true }));
    renderAt("/settings");

    fireEvent.click(screen.getByRole("button", { name: /Language: English/i }));
    fireEvent.click(screen.getByRole("option", { name: "नेपाली" }));

    expect(document.documentElement.lang).toBe("ne");
    expect(document.body.classList.contains("leading-relaxed")).toBe(true);
    const savedPrefs = JSON.parse(window.localStorage.getItem(PREFS_STORAGE_KEY) ?? "{}") as {
      lang?: string;
    };
    expect(savedPrefs.lang).toBe("ne");
  });

  it("closes LanguagePicker on Escape key or close button", () => {
    renderAt("/settings");

    fireEvent.click(screen.getByRole("button", { name: /Language: English/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Language: English/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
