import languageList from "./languages.json";

export const SUPPORTED_LANGUAGES = ["ko", "en", "vi", "zh", "uz", "mn", "ne"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface LanguageInfo {
  code: Language;
  nativeName: string;
  englishName: string;
  dir: "ltr" | "rtl";
  status: "source" | "done" | "draft";
}

export const LANGUAGES = languageList as LanguageInfo[];

export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function pickLanguage(candidates: readonly string[]): Language {
  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split("-")[0] ?? "";
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}
