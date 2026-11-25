import {
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGES,
  pickLanguage,
  type Language,
  type LanguageInfo,
} from "@du-menu-scan/shared";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "../i18n/en.json";
import ko from "../i18n/ko.json";
import mn from "../i18n/mn.json";
import ne from "../i18n/ne.json";
import uz from "../i18n/uz.json";
import vi from "../i18n/vi.json";
import zh from "../i18n/zh.json";

export const LANGUAGE_STORAGE_KEY = "du-menu-scan:lang";
export const PREFS_STORAGE_KEY = "du-menu-scan:prefs";

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  vi: { translation: vi },
  zh: { translation: zh },
  uz: { translation: uz },
  mn: { translation: mn },
  ne: { translation: ne },
} as const;

export function getLanguageInfo(code: Language): LanguageInfo {
  const found = LANGUAGES.find((item) => item.code === code);
  if (found) return found;
  return (
    LANGUAGES.find((item) => item.code === DEFAULT_LANGUAGE) ?? {
      code: DEFAULT_LANGUAGE,
      nativeName: "English",
      englishName: "English",
      dir: "ltr",
      status: "source",
    }
  );
}

export function readStoredLanguage(): Language | null {
  try {
    const direct = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (direct && isLanguage(direct)) {
      return direct;
    }
    const rawPrefs = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (rawPrefs) {
      const parsed = JSON.parse(rawPrefs) as { lang?: unknown };
      if (typeof parsed?.lang === "string" && isLanguage(parsed.lang)) {
        return parsed.lang;
      }
    }
  } catch {
    // Ignore storage access or JSON errors
  }
  return null;
}

export function detectInitialLanguage(): Language {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }
  const stored = readStoredLanguage();
  if (stored) {
    return stored;
  }
  const browserCandidates =
    Array.isArray(window.navigator?.languages) && window.navigator.languages.length > 0
      ? window.navigator.languages
      : window.navigator?.language
        ? [window.navigator.language]
        : [];
  return pickLanguage(browserCandidates);
}

export function applyDocumentLanguage(lang: Language): void {
  if (typeof document === "undefined") return;
  const info = getLanguageInfo(lang);
  document.documentElement.lang = info.code;
  document.documentElement.dir = info.dir;
  if (document.body) {
    document.body.classList.toggle("leading-relaxed", info.code === "ne");
  }
}

export function persistLanguage(lang: Language): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    const rawPrefs = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (rawPrefs) {
      const parsed = JSON.parse(rawPrefs) as Record<string, unknown>;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        parsed.lang = lang;
        window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(parsed));
      }
    }
  } catch {
    // Ignore storage write errors
  }
}

export async function changeAppLanguage(lang: Language): Promise<void> {
  persistLanguage(lang);
  applyDocumentLanguage(lang);
  await i18n.changeLanguage(lang);
}

const initialLanguage = detectInitialLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

applyDocumentLanguage(initialLanguage);

i18n.on("languageChanged", (lng) => {
  if (isLanguage(lng)) {
    applyDocumentLanguage(lng);
  }
});

export { i18n };
