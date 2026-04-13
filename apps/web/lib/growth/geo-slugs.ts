/**
 * Geo slugs for SEO landing pages (/buy, /rent, /mortgage).
 * Canada (primary) + USA-ready slugs for future inventory.
 */

import type { Prisma } from "@prisma/client";
import { fsboCityWhereFromParam, normalizeCitySlug } from "@/lib/geo/city-search";

/** Canadian cities (aligned with CITY_SLUGS) + US expansion examples. */
export const GROWTH_CITY_SLUGS = [
  "montreal",
  "laval",
  "quebec",
  "new-york",
  "miami",
] as const;

export type GrowthCitySlug = (typeof GROWTH_CITY_SLUGS)[number];

export type GrowthRegion = "CA" | "US";

export function growthCityRegion(slug: GrowthCitySlug): GrowthRegion {
  return slug === "new-york" || slug === "miami" ? "US" : "CA";
}

function fold(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s_]+/g, "-");
}

/**
 * Resolve URL param to a supported growth slug, or null → 404.
 */
export function parseGrowthCitySlugParam(param: string | undefined): GrowthCitySlug | null {
  if (!param?.trim()) return null;
  const ca = normalizeCitySlug(param);
  if (ca && GROWTH_CITY_SLUGS.includes(ca as GrowthCitySlug)) return ca as GrowthCitySlug;
  const t = fold(param);
  if (t === "new-york" || t === "nyc" || t === "newyork") return "new-york";
  if (t === "miami") return "miami";
  if (GROWTH_CITY_SLUGS.includes(t as GrowthCitySlug)) return t as GrowthCitySlug;
  return null;
}

/** Human label for titles and copy. */
export function growthCityDisplayName(slug: GrowthCitySlug): string {
  switch (slug) {
    case "montreal":
      return "Montreal";
    case "laval":
      return "Laval";
    case "quebec":
      return "Quebec City";
    case "new-york":
      return "New York";
    case "miami":
      return "Miami";
    default:
      return slug;
  }
}

/** Query string passed to BNHUB search & city filters. */
export function growthCitySearchQuery(slug: GrowthCitySlug): string {
  switch (slug) {
    case "montreal":
      return "Montreal";
    case "laval":
      return "laval";
    case "quebec":
      return "quebec";
    case "new-york":
      return "New York";
    case "miami":
      return "Miami";
    default:
      return slug;
  }
}

/** FSBO (buy) listings filter by city. */
export function growthFsboWhereForSlug(slug: GrowthCitySlug): Prisma.FsboListingWhereInput {
  const q = growthCitySearchQuery(slug);
  if (slug === "new-york") {
    return { city: { contains: "New York", mode: "insensitive" } };
  }
  if (slug === "miami") {
    return { city: { contains: "Miami", mode: "insensitive" } };
  }
  return fsboCityWhereFromParam(q);
}
