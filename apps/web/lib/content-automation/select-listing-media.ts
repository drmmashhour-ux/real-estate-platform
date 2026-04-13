import type { ShortTermListing } from "@prisma/client";

/**
 * Prefer ordered photos from `BnhubListingPhoto`, then legacy `photos` JSON URLs.
 */
export function selectListingImageUrls(
  listing: ShortTermListing & { listingPhotos?: { url: string; sortOrder?: number | null }[] }
): string[] {
  const ordered = (listing.listingPhotos ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((p) => p.url)
    .filter(Boolean);

  if (ordered.length > 0) return ordered;

  const raw = listing.photos;
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string" && u.length > 4);
  }
  return [];
}

export function selectHeroImageUrl(listing: ShortTermListing & { listingPhotos?: { url: string }[] }): string | null {
  const urls = selectListingImageUrls(listing);
  return urls[0] ?? null;
}

/**
 * Pick 3–6 URLs for short-form video (hero first). No synthetic images.
 */
export function selectBestImagesForVideo(
  listing: ShortTermListing & { listingPhotos?: { url: string; sortOrder?: number | null }[] },
  opts?: { min?: number; max?: number }
): string[] {
  const min = opts?.min ?? 3;
  const max = opts?.max ?? 6;
  const all = selectListingImageUrls(listing);
  if (all.length < min) return all;
  return all.slice(0, max);
}
