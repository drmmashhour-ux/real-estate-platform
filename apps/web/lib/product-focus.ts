/**
 * When true: global header hides on investment-shell routes (MvpNav present),
 * mortgage/growth sticky CTAs are suppressed, footer emphasizes investment links.
 * No routes are deleted — other hubs remain reachable via direct URLs and search.
 */
export const INVESTMENT_HUB_FOCUS = true;

/** Skip heavy marketplace/DB fetches on the homepage for faster TTFB (launch traffic). */
export const LAUNCH_LIGHT_HOME_FETCH = true;

/** Routes that render MvpNav inside the page — global Header is hidden to avoid duplicate nav */
export function isInvestmentShellPath(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/") return true;
  if (p.startsWith("/analyze")) return true;
  if (p.startsWith("/compare")) return true;
  if (p.startsWith("/pricing")) return true;
  if (p.startsWith("/deal")) return true;
  if (p.startsWith("/demo")) return true;
  /** Portfolio dashboard at /dashboard (investment MVP) — distinct from /dashboard/broker etc. */
  if (p === "/dashboard") return true;
  return false;
}
