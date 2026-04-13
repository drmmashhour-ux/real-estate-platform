import { cityToSlug } from "@/lib/market/slug";

/** URL segment for property type, room type, etc. */
export function slugifyPropertySegment(raw: string | null | undefined): string {
  return cityToSlug(raw || "home");
}

/** Canonical public listing URL — stable id segment for sharing (TikTok, Instagram, SMS). */
export function buildFsboPublicListingPath(row: {
  id: string;
  city: string;
  propertyType: string | null;
}): string {
  void row.city;
  void row.propertyType;
  return `/listings/${row.id}`;
}

export function buildBnhubStaySeoSlug(row: {
  id: string;
  city: string | null | undefined;
  propertyType: string | null | undefined;
}): string {
  const city = slugifyPropertySegment(row.city ?? "stay");
  const type = slugifyPropertySegment(row.propertyType ?? "rental");
  return `${city}-${type}~${row.id}`;
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
 * Keys to try when resolving `/listings/[segment]`:
 * - Full segment (plain `id`, full SEO slug, or `prefix~id`)
 * - Substring after first `~` (canonical FSBO/BNHUB SEO URLs)
 * - Last 5 hyphen parts — legacy URLs before `~` separator (hyphenated UUIDs in the path)
 * - Trailing cuid segment (no hyphens)
 */
export function publicListingPathLookupKeys(segment: string): string[] {
  const s = decodeURIComponent(segment).trim();
  if (!s) return [];
  const keys: string[] = [];
  const add = (k: string) => {
    if (k && !keys.includes(k)) keys.push(k);
  };
  add(s);
  const tilde = s.indexOf("~");
  if (tilde !== -1) {
    add(s.slice(tilde + 1));
  }
  const parts = s.split("-").filter(Boolean);
  if (parts.length >= 5) {
    add(parts.slice(-5).join("-"));
  }
  const tail = parseTailListingIdFromSlug(s);
  if (tail) add(tail);
  return keys;
}

/** Same resolution strategy for `/stays/[slug]` (BNHUB). */
export function stayPathLookupKeys(slug: string): string[] {
  return publicListingPathLookupKeys(slug);
}
