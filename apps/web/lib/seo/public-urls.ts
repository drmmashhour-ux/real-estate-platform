import { cityToSlug } from "@/lib/market/slug";

/** URL segment for property type, room type, etc. */
export function slugifyPropertySegment(raw: string | null | undefined): string {
  return cityToSlug(raw || "home");
}

export function buildFsboPublicListingPath(row: {
  id: string;
  city: string;
  propertyType: string | null;
}): string {
  return `/listings/${slugifyPropertySegment(row.city)}-${slugifyPropertySegment(row.propertyType)}-${row.id}`;
}

export function buildBnhubStaySeoSlug(row: {
  id: string;
  city: string | null | undefined;
  propertyType: string | null | undefined;
}): string {
  const city = slugifyPropertySegment(row.city ?? "stay");
  const type = slugifyPropertySegment(row.propertyType ?? "rental");
  return `${city}-${type}-${row.id}`;
}

const CUID_LIKE = /^[a-z0-9]{20,32}$/i;

/** If slug ends with a cuid-like id after kebab segments, return that id; else null. */
export function parseTailListingIdFromSlug(slug: string): string | null {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length < 3) return null;
  const last = parts[parts.length - 1] ?? "";
  return CUID_LIKE.test(last) ? last : null;
}

/**
 * Ordered keys to try when resolving a public listing URL segment (full slug or raw id).
 */
export function publicListingPathLookupKeys(segment: string): string[] {
  const s = decodeURIComponent(segment).trim();
  if (!s) return [];
  const keys = new Set<string>([s]);
  const tail = parseTailListingIdFromSlug(s);
  if (tail) keys.add(tail);
  return [...keys];
}

/** Same resolution strategy for `/stays/[slug]` (BNHub). */
export function stayPathLookupKeys(slug: string): string[] {
  return publicListingPathLookupKeys(slug);
}
