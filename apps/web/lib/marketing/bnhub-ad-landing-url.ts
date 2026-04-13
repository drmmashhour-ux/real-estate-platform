/**
 * Paid social → BNHUB stay **exact listing** URLs (ad ↔ landing consistency).
 *
 * Use the public stay path with **listing code** (e.g. `LST-ABC123`) when available
 * so the ad destination matches one listing row.
 *
 * @example TikTok “price shock” creative
 * ```
 * https://YOUR_DOMAIN/en/ca/bnhub/stays/LST-XXXXXX?utm_source=tiktok&utm_campaign=price_shock&utm_medium=paid_social
 * ```
 *
 * Middleware persists `utm_*` into the first-touch attribution cookie; downstream
 * `listing_viewed` / `booking_started` beacons merge the same attribution.
 */

export type BnhubStayAdUtm = {
  utm_source: string;
  utm_campaign: string;
  /** e.g. `paid_social` — optional but recommended */
  utm_medium?: string;
  /** e.g. creative or ad set id */
  utm_content?: string;
};

/** Example preset matching common TikTok + campaign naming. */
export const BNHUB_AD_UTM_EXAMPLE: BnhubStayAdUtm = {
  utm_source: "tiktok",
  utm_campaign: "price_shock",
  utm_medium: "paid_social",
};

/**
 * Ready-made query string (no `?`) for ad platforms — pair with `buildBnhubStayAdLandingPath` / full URL in ad manager.
 * Ensures consistent attribution: `ad_click` → `listing_view` → `booking_started`.
 */
export const BNHUB_AD_UTM_QUERY_EXAMPLE = "utm_source=tiktok&utm_campaign=price_shock&utm_medium=paid_social" as const;

/**
 * Path + query only (no origin) — safe for `Link` href or copy into ad manager.
 * `listingSlug` is `listingCode` or legacy id in the URL segment.
 */
export function buildBnhubStayAdLandingPath(args: {
  locale: string;
  country: string;
  listingSlug: string;
  utm: BnhubStayAdUtm;
}): string {
  const { locale, country, listingSlug, utm } = args;
  const base = `/${locale}/${country}/bnhub/stays/${encodeURIComponent(listingSlug.trim())}`;
  const p = new URLSearchParams();
  p.set("utm_source", utm.utm_source.trim());
  p.set("utm_campaign", utm.utm_campaign.trim());
  if (utm.utm_medium?.trim()) p.set("utm_medium", utm.utm_medium.trim());
  if (utm.utm_content?.trim()) p.set("utm_content", utm.utm_content.trim());
  return `${base}?${p.toString()}`;
}

/**
 * Absolute URL for ad platforms that require full string (TikTok Ads, Meta).
 */
export function buildBnhubStayAdLandingUrl(args: {
  siteOrigin: string;
  locale: string;
  country: string;
  listingSlug: string;
  utm: BnhubStayAdUtm;
}): string {
  const path = buildBnhubStayAdLandingPath(args);
  const origin = args.siteOrigin.replace(/\/$/, "");
  return `${origin}${path}`;
}

/**
 * True when the URL includes any common UTM field (paid/social attribution).
 * Enables above-the-fold treatment (banner, price emphasis) on stay landings.
 */
export function hasAdUtmParams(
  sp: Record<string, string | string[] | undefined> | undefined,
): boolean {
  if (!sp) return false;
  const s = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v.trim() : "";
  };
  return Boolean(s("utm_source") || s("utm_campaign") || s("utm_medium"));
}
