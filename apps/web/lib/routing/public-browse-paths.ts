/**
 * Pathnames that must stay reachable without a session (homepage redirect target, listings, BNHub).
 * Used by middleware for the staging login bypass; do not add `requireAuthenticatedUser()` to pages
 * under these paths.
 */
export function isPublicBrowseSurface(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  if (pathname.startsWith("/listings")) return true;
  if (pathname.startsWith("/bnhub")) return true;
  return false;
}
