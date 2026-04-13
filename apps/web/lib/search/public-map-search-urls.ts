/**
 * Canonical URLs for “search on the map” across buy, rent, and BNHUB stays.
 * `mapLayout=map` opens map-first; the UI also scrolls to the map when toggled in-page.
 */

export const LISTINGS_MAP_SEARCH_ID = "listings-map-search";
export const BNHUB_STAYS_MAP_SECTION_ID = "bnhub-stays-map-search";

export const PUBLIC_MAP_SEARCH_URL = {
  listingsBuy: "/listings?mapLayout=map",
  listingsRent: "/listings?dealType=RENT&mapLayout=map",
  bnhubStays: "/bnhub/stays?mapLayout=map",
} as const;

export function listingsMapSearchUrl(opts?: { city?: string; dealType?: "RENT" }): string {
  const p = new URLSearchParams();
  if (opts?.dealType === "RENT") p.set("dealType", "RENT");
  if (opts?.city?.trim()) p.set("city", opts.city.trim());
  p.set("mapLayout", "map");
  return `/listings?${p.toString()}`;
}

export function bnhubStaysMapSearchUrl(opts?: { city?: string }): string {
  const p = new URLSearchParams();
  p.set("mapLayout", "map");
  if (opts?.city?.trim()) p.set("city", opts.city.trim());
  return `/bnhub/stays?${p.toString()}`;
}
