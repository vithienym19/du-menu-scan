import type { MenuView } from "@du-menu-scan/shared";

const MENU_CACHE_PREFIX = "du-menu-scan:last-menu:";

export function menuCacheKey(code: string): string {
  return `${MENU_CACHE_PREFIX}${code}`;
}

function isMenuView(value: unknown): value is MenuView {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.date !== "string") return false;
  if (v.meal !== "lunch" && v.meal !== "dinner") return false;
  if (v.status !== "published" && v.status !== "empty" && v.status !== "closed") return false;
  if (!Array.isArray(v.corners)) return false;
  if (typeof v.cafeteria !== "object" || v.cafeteria === null) return false;
  const caf = v.cafeteria as Record<string, unknown>;
  if (typeof caf.code !== "string") return false;
  if (typeof caf.name !== "object" || caf.name === null) return false;
  if (typeof (caf.name as Record<string, unknown>).ko !== "string") return false;
  return true;
}

export function readCachedMenu(code: string): MenuView | null {
  if (typeof window === "undefined" || !code) return null;
  try {
    const raw = window.localStorage.getItem(menuCacheKey(code));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isMenuView(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedMenu(code: string, menu: MenuView): void {
  if (typeof window === "undefined" || !code) return;
  try {
    window.localStorage.setItem(menuCacheKey(code), JSON.stringify(menu));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function clearCachedMenu(code: string): void {
  if (typeof window === "undefined" || !code) return;
  try {
    window.localStorage.removeItem(menuCacheKey(code));
  } catch {
    // Ignore storage errors
  }
}
