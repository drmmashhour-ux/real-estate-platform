/** HttpOnly cookie — server reads for redirects; client updates via `/api/dashboard/lecipm-console-preference`. */
export const LECIPM_DASHBOARD_CONSOLE_COOKIE = "lecipm_dashboard_console";

export type LecipmDashboardConsolePreference = "classic" | "lecipm";

/** Mirrors cookie for client analytics / UX hints (optional). */
export const LECIPM_DASHBOARD_CONSOLE_STORAGE_KEY = "lecipm_dashboard_console";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 400;

export function cookieOpts(): {
  path: string;
  maxAge: number;
  sameSite: "lax";
  secure: boolean;
  httpOnly: boolean;
} {
  return {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  };
}

/**
 * Whether hitting `/dashboard` should redirect to `/dashboard/lecipm`.
 * Unset cookie follows env default; explicit `classic` / `lecipm` wins.
 */
export function shouldRedirectRootDashboardToLecipm(
  featureLecipmDefault: boolean,
  cookieValue: string | undefined,
): boolean {
  if (cookieValue === "classic") return false;
  if (cookieValue === "lecipm") return true;
  return featureLecipmDefault;
}
