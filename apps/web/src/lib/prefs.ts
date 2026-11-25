import { sanitizePrefs, type Prefs } from "@du-menu-scan/shared";

export const PREFS_STORAGE_KEY = "du-menu-scan:prefs";

/**
 * Reads student preferences from localStorage and normalizes them through
 * sanitizePrefs(). Read-only; UI-08 will add persistence writes.
 */
export function readPrefs(): Prefs {
  if (typeof window === "undefined") {
    return sanitizePrefs(null);
  }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw === null) {
      return sanitizePrefs(null);
    }
    const parsed: unknown = JSON.parse(raw);
    return sanitizePrefs(parsed);
  } catch {
    return sanitizePrefs(null);
  }
}
