const VALID_TODAY_PATH_RE = /^\/r\/[a-z0-9-]+\/today$/;
const SCHEME_PREFIX_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const DUMMY_ORIGIN = "https://du-menu.local";

/**
 * Checks that a redirect target is a relative, same-origin in-app path:
 * single leading `/`, no `//` prefix, no backslashes, and no URL scheme.
 */
export function isSafeInternalPath(path: string | null): path is string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return false;
  }
  if (SCHEME_PREFIX_RE.test(path)) {
    return false;
  }
  try {
    const resolved = new URL(path, DUMMY_ORIGIN);
    return resolved.origin === DUMMY_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * Stricter path check for S0 Welcome `?next=`: only accepts `/r/:code/today`
 * where `:code` matches `[a-z0-9-]+`.
 */
export function isValidTodayPath(path: string | null): path is string {
  return isSafeInternalPath(path) && VALID_TODAY_PATH_RE.test(path);
}

/**
 * Returns `nextParam` when it is a valid `/r/:code/today` path, otherwise `/`.
 */
export function resolveWelcomeNextPath(nextParam: string | null): string {
  return isValidTodayPath(nextParam) ? nextParam : "/";
}
