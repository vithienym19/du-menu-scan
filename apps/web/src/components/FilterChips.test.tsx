import { NO_FILTERS, type MenuFilters } from "@du-menu-scan/shared";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { changeAppLanguage } from "../lib/i18n";
import { FilterChips } from "./FilterChips";
import { LanguagePicker as ReexportedLanguagePicker } from "./index";
import { LanguagePicker as DirectLanguagePicker } from "./LanguagePicker";

function ControlledFilterChips({ initial = NO_FILTERS }: { initial?: MenuFilters }) {
  const [filters, setFilters] = useState<MenuFilters>(initial);
  return <FilterChips value={filters} onChange={setFilters} />;
}

describe("UI-03 FilterChips and LanguagePicker export", () => {
  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("re-exports the existing LanguagePicker without creating a second implementation", () => {
    expect(ReexportedLanguagePicker).toBe(DirectLanguagePicker);
  });

  it("renders all three filter chips with aria-pressed='false' when NO_FILTERS is passed", () => {
    const onChange = vi.fn();
    render(<FilterChips value={NO_FILTERS} onChange={onChange} />);

    const group = screen.getByRole("group", { name: "Filters" });
    const notSpicy = within(group).getByRole("button", { name: "Not spicy" });
    const noPork = within(group).getByRole("button", { name: "No pork" });
    const vegetarian = within(group).getByRole("button", { name: "Vegetarian" });

    for (const button of [notSpicy, noPork, vegetarian]) {
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button.querySelector("svg")).toBeNull();
      expect(button).toHaveClass("min-h-11", "min-w-11", "focus-visible:outline-brand");
    }
  });

  it("calls onChange with toggled MenuFilters without mutating value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial: MenuFilters = { ...NO_FILTERS };

    render(<FilterChips value={initial} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Not spicy" }));
    expect(onChange).toHaveBeenLastCalledWith({
      notSpicy: true,
      noPork: false,
      vegetarian: false,
    });
    expect(initial).toEqual(NO_FILTERS);

    await user.click(screen.getByRole("button", { name: "No pork" }));
    expect(onChange).toHaveBeenLastCalledWith({
      notSpicy: false,
      noPork: true,
      vegetarian: false,
    });

    await user.click(screen.getByRole("button", { name: "Vegetarian" }));
    expect(onChange).toHaveBeenLastCalledWith({
      notSpicy: false,
      noPork: false,
      vegetarian: true,
    });
  });

  it("updates aria-pressed and renders a check icon when active", async () => {
    const user = userEvent.setup();
    render(<ControlledFilterChips />);

    const noPork = screen.getByRole("button", { name: "No pork" });
    expect(noPork).toHaveAttribute("aria-pressed", "false");
    expect(noPork.querySelector("svg")).toBeNull();

    await user.click(noPork);
    expect(noPork).toHaveAttribute("aria-pressed", "true");
    const checkIcon = noPork.querySelector("svg");
    expect(checkIcon).not.toBeNull();
    expect(checkIcon).toHaveAttribute("aria-hidden", "true");

    await user.click(noPork);
    expect(noPork).toHaveAttribute("aria-pressed", "false");
    expect(noPork.querySelector("svg")).toBeNull();
  });

  it("is keyboard operable with Tab, Space, and Enter", async () => {
    const user = userEvent.setup();
    render(<ControlledFilterChips />);

    const notSpicy = screen.getByRole("button", { name: "Not spicy" });
    const noPork = screen.getByRole("button", { name: "No pork" });
    const vegetarian = screen.getByRole("button", { name: "Vegetarian" });

    await user.tab();
    expect(notSpicy).toHaveFocus();
    await user.keyboard(" ");
    expect(notSpicy).toHaveAttribute("aria-pressed", "true");

    await user.tab();
    expect(noPork).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(noPork).toHaveAttribute("aria-pressed", "true");

    await user.tab();
    expect(vegetarian).toHaveFocus();
    await user.keyboard(" ");
    expect(vegetarian).toHaveAttribute("aria-pressed", "true");

    // Toggle off with Enter
    await user.keyboard("{Enter}");
    expect(vegetarian).toHaveAttribute("aria-pressed", "false");
  });
});
