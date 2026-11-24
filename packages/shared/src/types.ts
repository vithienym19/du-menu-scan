import type { Language } from "./languages";

/** Text in several languages. Korean is the source and always present. */
export type LocalizedText = { ko: string } & Partial<Record<Exclude<Language, "ko">, string>>;

export const DIET_TAGS = ["pork", "beef", "chicken", "seafood", "alcohol"] as const;
export type DietTag = (typeof DIET_TAGS)[number];

/** Allergen codes follow Korea's MFDS labelling list (verified in BE-06). */
export type AllergenCode = string;

export type SpiceLevel = 0 | 1 | 2 | 3 | 4;
export type Meal = "lunch" | "dinner";
export type MenuStatus = "published" | "empty" | "closed";
export type WarningStatus = "ok" | "caution" | "avoid" | "unverified";
export type DietType = "none" | "vegetarian" | "halal";
export type ScanEntry = "qr" | "direct";

export interface OpeningHours {
  lunch?: string;
  dinner?: string;
}

export interface CafeteriaView {
  id: string;
  code: string;
  name: LocalizedText;
  openingHours: OpeningHours;
}

export interface AllergenView {
  code: AllergenCode;
  name: LocalizedText;
}

export interface IngredientView {
  name: LocalizedText;
  isMain: boolean;
  /** Not obvious from the dish name (broth, sauce, processed food). */
  isHidden: boolean;
}

export interface DishView {
  id: string;
  /** Only approved translations are included (BR7). */
  name: LocalizedText;
  description?: LocalizedText;
  photoUrl: string | null;
  spiceLevel: SpiceLevel;
  ingredients: IngredientView[];
  allergens: AllergenView[];
  /** Derived from ingredients, hidden ones included (BR5). */
  dietTags: DietTag[];
  allergensConfirmed: boolean;
  /** ISO date (YYYY-MM-DD) or null when never verified. */
  verifiedAt: string | null;
}

export interface MenuItemView {
  dish: DishView;
  /** KRW */
  price: number | null;
}

export interface CornerView {
  id: string;
  name: LocalizedText;
  items: MenuItemView[];
}

export interface MenuView {
  cafeteria: CafeteriaView;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  meal: Meal;
  status: MenuStatus;
  corners: CornerView[];
}

/** Stored only in the student's localStorage (BR8). */
export interface Prefs {
  lang: Language;
  avoidTags: DietTag[];
  avoidAllergens: AllergenCode[];
  /** Highest spice level the student accepts without a Caution. */
  spiceTolerance: SpiceLevel;
  dietType: DietType;
  onboarded: boolean;
}

export interface ScanEventInput {
  cafeteriaCode: string;
  lang: Language;
  entry: ScanEntry;
}
