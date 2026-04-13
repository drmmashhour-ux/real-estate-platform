import { appPathnameFromUrl } from "@/i18n/pathname";

/**
 * Pathnames that must stay reachable without a session (homepage redirect target, listings, BNHUB).
 * Used by middleware for the staging login bypass; do not add `requireAuthenticatedUser()` to pages
 * under these paths.
 *
 * Client code: avoid **ambient** `useEffect` + `router.replace("/auth/login")` while the user is on
 * these paths. Targeted CTAs (favorites, messages, checkout) may still navigate to login.
 */
export function isPublicBrowseSurface(pathname: string): boolean {
  if (!pathname) return false;
  const path = appPathnameFromUrl(pathname);
  if (path === "/") return true;
  if (path.startsWith("/listings")) return true;
  if (path.startsWith("/bnhub")) return true;
  return false;
}

/**
 * For client-only guards: treat unknown path during hydration as “do not force login” to avoid
 * redirect flashes on `/`, `/listings`, and `/bnhub`.
 */
export function allowAnonymousClientShell(pathname: string | null | undefined): boolean {
  if (pathname == null || pathname === "") return true;
  return isPublicBrowseSurface(pathname);
}
