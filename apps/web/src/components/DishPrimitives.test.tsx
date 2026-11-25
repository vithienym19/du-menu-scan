import { DIET_TAGS, SPICE_LEVELS } from "@du-menu-scan/shared";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { AppRoutes } from "../App";
import { changeAppLanguage } from "../lib/i18n";
import { HiddenIngredientTag } from "./HiddenIngredientTag";
import { IconRow } from "./IconRow";
import { SpiceMeter } from "./SpiceMeter";
import { WarningBadge } from "./WarningBadge";

describe("UI-02 Dish display primitives", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
  });

  describe("WarningBadge", () => {
    it("hides OK badge by default and shows it when showOk is true", () => {
      const { container, rerender } = render(<WarningBadge status="ok" />);
      expect(container).toBeEmptyDOMElement();

      rerender(<WarningBadge status="ok" showOk={true} />);
      expect(screen.getByText("OK for you")).toBeInTheDocument();
    });

    it("renders caution, avoid and unverified badges with visible text labels", () => {
      render(
        <div>
          <WarningBadge status="caution" />
          <WarningBadge status="avoid" />
          <WarningBadge status="unverified" />
        </div>,
      );

      expect(screen.getByText("Caution")).toBeInTheDocument();
      expect(screen.getByText("Avoid")).toBeInTheDocument();
      expect(screen.getByText("Not verified")).toBeInTheDocument();
    });
  });

  describe("SpiceMeter", () => {
    it("renders all spice levels (0-4) with 4 dots and a visible text label", () => {
      const expectedLabels = ["Not spicy", "Mild", "Medium", "Hot", "Very hot"];

      for (const level of SPICE_LEVELS) {
        const { container, unmount } = render(<SpiceMeter level={level} />);
        expect(screen.getByText(expectedLabels[level]!)).toBeInTheDocument();
        const filledDots = container.querySelectorAll('[data-filled="true"]');
        const emptyDots = container.querySelectorAll('[data-filled="false"]');
        expect(filledDots).toHaveLength(level);
        expect(emptyDots).toHaveLength(4 - level);
        unmount();
      }
    });
  });

  describe("IconRow", () => {
    it("renders every DietTag with its text label", () => {
      render(<IconRow tags={DIET_TAGS} vegetarian={false} />);

      expect(screen.getByText("Pork")).toBeInTheDocument();
      expect(screen.getByText("Beef")).toBeInTheDocument();
      expect(screen.getByText("Chicken")).toBeInTheDocument();
      expect(screen.getByText("Seafood")).toBeInTheDocument();
      expect(screen.getByText("Alcohol")).toBeInTheDocument();
      expect(screen.queryByText("Vegetarian")).not.toBeInTheDocument();
    });

    it("renders vegetarian badge only when vegetarian is true", () => {
      const { rerender, container } = render(<IconRow tags={[]} vegetarian={true} />);
      expect(screen.getByText("Vegetarian")).toBeInTheDocument();

      rerender(<IconRow tags={[]} vegetarian={false} />);
      expect(container).toBeEmptyDOMElement();

      rerender(<IconRow tags={[]} vegetarian={null} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("HiddenIngredientTag", () => {
    it("renders the hidden ingredient label with the ingredient name", () => {
      render(<HiddenIngredientTag name="Anchovy broth" />);
      expect(screen.getByText("Hidden: Anchovy broth")).toBeInTheDocument();
    });
  });

  describe("/dev/components route", () => {
    it("renders all component variants in dev mode", () => {
      render(
        <MemoryRouter initialEntries={["/dev/components"]}>
          <AppRoutes />
        </MemoryRouter>,
      );

      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dev: Components");
      expect(screen.getByText("OK for you")).toBeInTheDocument();
      expect(screen.getByText("Caution")).toBeInTheDocument();
      expect(screen.getByText("Avoid")).toBeInTheDocument();
      expect(screen.getAllByText("Not verified").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Very hot").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Hidden: Anchovy broth").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId("ok-hidden-slot")).toBeEmptyDOMElement();
    });
  });
});
