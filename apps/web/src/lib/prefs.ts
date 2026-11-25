import { DEFAULT_PREFS, sanitizePrefs, type Prefs } from "@du-menu-scan/shared";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const PREFS_STORAGE_KEY = "du-menu-scan:prefs";

type PrefsListener = () => void;
const listeners = new Set<PrefsListener>();

function notifyPrefsListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export interface ReadPrefsResult {
  prefs: Prefs;
  /** True when localStorage already had a non-null entry for du-menu-scan:prefs. */
  hasStoredData: boolean;
}

/**
 * Reads student preferences from localStorage and normalizes them through
 * sanitizePrefs(), starting from DEFAULT_PREFS. Also reports whether raw stored
 * data was present so entry routes can distinguish a brand-new visitor (→ S0)
 * from a visitor whose stored preferences were corrupt/repaired (→ S4).
 */
export function readPrefsWithMeta(): ReadPrefsResult {
  if (typeof window === "undefined") {
    return { prefs: sanitizePrefs(DEFAULT_PREFS), hasStoredData: false };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw === null) {
      return { prefs: sanitizePrefs(DEFAULT_PREFS), hasStoredData: false };
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed === null) {
        return { prefs: sanitizePrefs(raw), hasStoredData: true };
      }
      return { prefs: sanitizePrefs(parsed), hasStoredData: true };
    } catch {
      // Corrupt JSON in localStorage: sanitizePrefs(raw) returns the strictest
      // fail-safe preferences with onboarded: false so we route to S4.
      return { prefs: sanitizePrefs(raw), hasStoredData: true };
    }
  } catch {
    return { prefs: sanitizePrefs(DEFAULT_PREFS), hasStoredData: false };
  }
}

/**
 * Reads student preferences from localStorage and normalizes them through
 * sanitizePrefs() starting from DEFAULT_PREFS.
 */
export function readPrefs(): Prefs {
  return readPrefsWithMeta().prefs;
}

/**
 * Persists student preferences to localStorage (the only writer of
 * du-menu-scan:prefs). Always normalizes through sanitizePrefs() and marks
 * onboarded: true unless explicitly overridden. Never sends prefs to any server.
 */
export function writePrefs(
  input: Partial<Prefs> & Pick<Prefs, "dietType" | "spiceTolerance">,
): Prefs {
  const sanitized = sanitizePrefs({
    ...DEFAULT_PREFS,
    ...input,
    onboarded: input.onboarded ?? true,
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // Ignore storage write errors (e.g. quota or private mode)
    }
  }

  notifyPrefsListeners();
  return sanitized;
}

/**
 * Subscribe to preference updates across the app (both in-tab writes via
 * writePrefs and cross-tab storage events).
 */
export function subscribePrefs(listener: PrefsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * React hook returning the current sanitized Prefs and re-rendering immediately
 * whenever writePrefs() is called or localStorage changes.
 */
export function usePrefs(): Prefs {
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs());

  useEffect(() => {
    const handleUpdate = () => {
      setPrefs(readPrefs());
    };

    const unsubscribe = subscribePrefs(handleUpdate);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === PREFS_STORAGE_KEY) {
        handleUpdate();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return prefs;
}

/**
 * Redirects to `/settings?next=...` if localStorage had stored preferences
 * that were corrupt or not yet onboarded (fail-safe recovery to S4).
 */
export function useRequireOnboarding(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { prefs, hasStoredData } = readPrefsWithMeta();
    if (hasStoredData && !prefs.onboarded) {
      const currentPath = `${location.pathname}${location.search}`;
      navigate(`/settings?next=${encodeURIComponent(currentPath)}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);
}
