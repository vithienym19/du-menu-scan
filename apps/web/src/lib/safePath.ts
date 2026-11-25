const VALID_TODAY_PATH_RE = /^\/r\/[a-z0-9-]+\/today$/;

/**
 * Checks that a redirect target is a relative in-app path (single leading `/`,
 * never protocol-relative `//`).
 */
export function isSafeInternalPath(path: string | null): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
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
