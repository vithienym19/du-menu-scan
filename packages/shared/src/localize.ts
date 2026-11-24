import { DEFAULT_LANGUAGE, type Language } from "./languages";
import type { LocalizedText } from "./types";

export interface LocalizedResult {
  text: string;
  /** Language actually used. */
  lang: Language;
  /** True when the requested language was missing (show "translation pending"). */
  isFallback: boolean;
}

/** BR2: requested language → English → Korean. */
export function localize(text: LocalizedText, lang: Language): LocalizedResult {
  const order: Language[] = [lang, DEFAULT_LANGUAGE, "ko"];
  for (const candidate of order) {
    const value = text[candidate]?.trim();
    if (value) return { text: value, lang: candidate, isFallback: candidate !== lang };
  }
  return { text: text.ko, lang: "ko", isFallback: lang !== "ko" };
}
