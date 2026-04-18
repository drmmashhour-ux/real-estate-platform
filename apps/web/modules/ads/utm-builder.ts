import { getPublicAppUrl } from "@/lib/config/public-app-url";

export type UtmParams = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string | null;
  utm_content?: string | null;
};

/**
 * Build a full tracking URL for Ads / email (uses `NEXT_PUBLIC_APP_URL`).
 * `localeCountryPrefix` example: `/fr/ca` — required for locale-routed marketing pages.
 */
export function buildTrackedLandingUrl(input: {
  localeCountryPrefix: string;
  landingPath: string;
  utm: UtmParams;
}): string {
  const base = getPublicAppUrl().replace(/\/$/, "");
  const prefix = input.localeCountryPrefix.replace(/\/$/, "");
  const path = input.landingPath.startsWith("/") ? input.landingPath : `/${input.landingPath}`;
  const u = new URL(`${base}${prefix}${path}`);
  u.searchParams.set("utm_source", input.utm.utm_source);
  u.searchParams.set("utm_medium", input.utm.utm_medium);
  u.searchParams.set("utm_campaign", input.utm.utm_campaign);
  if (input.utm.utm_term?.trim()) u.searchParams.set("utm_term", input.utm.utm_term.trim());
  if (input.utm.utm_content?.trim()) u.searchParams.set("utm_content", input.utm.utm_content.trim());
  return u.toString();
}
