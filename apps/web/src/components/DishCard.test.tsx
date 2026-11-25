import { fixtureDishes, type DishView, type Prefs } from "@du-menu-scan/shared";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { AppRoutes } from "../App";
import { changeAppLanguage } from "../lib/i18n";
import { PREFS_STORAGE_KEY } from "../lib/prefs";
import { DishCard } from "./DishCard";

const dishById = (id: string): DishView => {
  const found = fixtureDishes.find((d) => d.id === id);
  if (!found) throw new Error(`Missing fixture dish: ${id}`);
  return found;
};

describe("UI-05 DishCard", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("en");
  });

  it("renders Korean name, translated name, formatted price, spice, icons, and hidden ingredients", () => {
    const doenjang = dishById("dish-doenjang-jjigae");
    render(<DishCard dish={doenjang} price={5000} />);

    const card = screen.getByTestId("dish-card-dish-doenjang-jjigae");
    expect(card).toHaveAttribute("data-status", "ok");
    expect(within(card).getByText("된장찌개")).toBeInTheDocument();
    expect(within(card).getByText("Soybean paste stew")).toBeInTheDocument();
    expect(within(card).getByText("₩5,000")).toBeInTheDocument();
    expect(within(card).getByText("Mild")).toBeInTheDocument();
    expect(within(card).getByText("Seafood")).toBeInTheDocument();
    expect(within(card).getByText("Hidden: Anchovy broth")).toBeInTheDocument();
    expect(within(card).queryByText("OK for you")).not.toBeInTheDocument();
    expect(screen.getByTestId("dish-photo-placeholder-dish-doenjang-jjigae")).toBeInTheDocument();
  });

  it("renders a lazy-loaded image when photoUrl is provided", () => {
    const jeyuk = dishById("dish-jeyuk-bokkeum");
    render(<DishCard dish={jeyuk} price={5500} />);

    const img = screen.getByRole("img", { name: "Spicy stir-fried pork" });
    expect(img).toHaveAttribute("src", jeyuk.photoUrl);
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("shows vegetarian badge from dietCompatibility when dish is verified vegetarian", () => {
    const bibimbap = dishById("dish-yachae-bibimbap");
    render(<DishCard dish={bibimbap} price={5000} />);

    expect(screen.getByText("Vegetarian")).toBeInTheDocument();
  });

  it("shows translation pending marker when falling back to another language (BR2)", async () => {
    await changeAppLanguage("vi");
    const donkkaseu = dishById("dish-donkkaseu");
    render(<DishCard dish={donkkaseu} price={6000} />);

    expect(screen.getByText("돈까스")).toBeInTheDocument();
    expect(screen.getByText("Pork cutlet")).toBeInTheDocument();
    expect(screen.getByText("Đang chờ bản dịch")).toBeInTheDocument();
  });

  it("shows only Korean name without translation pending when language is ko", async () => {
    await changeAppLanguage("ko");
    const donkkaseu = dishById("dish-donkkaseu");
    render(<DishCard dish={donkkaseu} />);

    expect(screen.getAllByText("돈까스")).toHaveLength(1);
    expect(screen.queryByText("Đang chờ bản dịch")).not.toBeInTheDocument();
    expect(screen.queryByText("Translation pending")).not.toBeInTheDocument();
  });

  it("never renders an unverified dish as OK and shows the Not verified badge", () => {
    const sundubu = dishById("dish-sundubu-jjigae");
    render(<DishCard dish={sundubu} price={5500} />);

    const card = screen.getByTestId("dish-card-dish-sundubu-jjigae");
    expect(card).toHaveAttribute("data-status", "unverified");
    expect(within(card).getByText("Not verified")).toBeInTheDocument();
    expect(within(card).queryByText("OK for you")).not.toBeInTheDocument();
  });

  it("reads prefs from localStorage and renders Caution and Avoid states with red outline for Avoid", () => {
    const prefs: Prefs = {
      lang: "en",
      avoidTags: ["pork"],
      avoidAllergens: [],
      spiceTolerance: 1,
      dietType: "none",
      onboarded: true,
    };
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));

    const jeyuk = dishById("dish-jeyuk-bokkeum");
    const bibimbap = dishById("dish-yachae-bibimbap");

    render(
      <div>
        <DishCard dish={jeyuk} price={5500} />
        <DishCard dish={bibimbap} price={5000} />
      </div>,
    );

    const avoidCard = screen.getByTestId("dish-card-dish-jeyuk-bokkeum");
    expect(avoidCard).toHaveAttribute("data-status", "avoid");
    expect(avoidCard.className).toContain("ring-avoid-line");
    expect(within(avoidCard).getByText("Avoid")).toBeInTheDocument();

    const cautionCard = screen.getByTestId("dish-card-dish-yachae-bibimbap");
    expect(cautionCard).toHaveAttribute("data-status", "caution");
    expect(cautionCard.className).not.toContain("ring-avoid-line");
    expect(within(cautionCard).getByText("Caution")).toBeInTheDocument();
  });

  it("wraps card in a Link when `to` prop is provided", () => {
    const udon = dishById("dish-udon");
    render(
      <MemoryRouter>
        <DishCard dish={udon} price={4500} to="/dish/dish-udon?date=2026-11-25" />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dish/dish-udon?date=2026-11-25");
  });

  it("renders every fixture dish on /dev/components", () => {
    render(
      <MemoryRouter initialEntries={["/dev/components"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    for (const dish of fixtureDishes) {
      expect(screen.getByTestId(`dish-card-${dish.id}`)).toBeInTheDocument();
    }
  });
});
