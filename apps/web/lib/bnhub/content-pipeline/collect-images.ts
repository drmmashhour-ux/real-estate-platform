import type { ShortTermListing, BnhubListingPhoto } from "@prisma/client";

/**
 * Merge legacy `photos` JSON with ordered `BnhubListingPhoto` rows (cover first).
 */
export function collectListingImageUrls(
  listing: Pick<ShortTermListing, "photos">,
  listingPhotos: Pick<BnhubListingPhoto, "url" | "isCover" | "sortOrder">[]
): string[] {
  const fromJson: string[] = [];
  if (Array.isArray(listing.photos)) {
    for (const p of listing.photos) {
      if (typeof p === "string" && p.trim()) fromJson.push(p.trim());
    }
  }
  const fromRows = [...listingPhotos]
    .sort((a, b) => {
      if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .map((p) => p.url.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [...fromRows, ...fromJson]) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
    if (out.length >= 12) break;
  }
  return out;
}
