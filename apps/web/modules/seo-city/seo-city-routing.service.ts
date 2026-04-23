import type { CitySlug } from "@/lib/geo/city-search";

/** Path segments under /city/[city]/... (no locale prefix — use withAppPrefix) */
export type SeoCitySegment =
  | ""
  | "investment"
  | "brokers"
  | "rent"
  | "rentals"
  | "buy"
  | `n/${string}`;

export function citySeoSegmentPath(citySlug: string, segment: SeoCitySegment): string {
  if (!segment) return `/city/${citySlug}`;
  if (segment.startsWith("n/")) return `/city/${citySlug}/${segment}`;
  return `/city/${citySlug}/${segment}`;
}

/**
 * Full path with locale/country for internal links in App Router marketing pages.
 * @param basePath e.g. `/en/ca` or from headers
 */
export function withLocaleCountryPath(
  locale: string,
  country: string,
  path: string
): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/") return `/${locale}/${country}`;
  return `/${locale}/${country}${p}`;
}

export function neighborhoodPath(citySlug: CitySlug, areaSlug: string): string {
  return `/city/${citySlug}/n/${areaSlug}`;
}
