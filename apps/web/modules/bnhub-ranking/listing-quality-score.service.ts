import { prisma } from "@/lib/db";

/**
 * Prefer persisted `ListingQualityScore`; otherwise a conservative heuristic from listing completeness (not ML).
 */
export async function resolveListingQualityScore(
  listingId: string,
): Promise<{ qualityScore: number; reasons: string[] }> {
  const persisted = await prisma.listingQualityScore.findUnique({
    where: { listingId },
    select: { qualityScore: true, reasonsJson: true, contentScore: true, trustScore: true },
  });

  if (persisted) {
    const reasons: string[] = [];
    reasons.push(`Quality index (persisted): ${persisted.qualityScore}`);
    if (persisted.contentScore > 0) reasons.push(`Content sub-score: ${persisted.contentScore}`);
    if (persisted.trustScore > 0) reasons.push(`Trust sub-score (quality row): ${persisted.trustScore}`);
    return { qualityScore: Math.min(100, Math.max(0, persisted.qualityScore)), reasons };
  }

  const l = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      description: true,
      photos: true,
      amenities: true,
      listingPhotos: { select: { id: true } },
    },
  });
  if (!l) return { qualityScore: 0, reasons: ["Listing not found"] };

  const photoN = Math.max(
    Array.isArray(l.photos) ? l.photos.filter((x) => typeof x === "string" && x.length > 0).length : 0,
    l.listingPhotos.length,
  );
  const amenityN = Array.isArray(l.amenities) ? l.amenities.length : 0;
  const descN = (l.description ?? "").trim().length;

  let score = 20;
  const reasons: string[] = [];
  if (photoN >= 5) {
    score += 25;
    reasons.push(`${photoN} photos (heuristic completeness)`);
  } else if (photoN >= 2) {
    score += 15;
    reasons.push(`${photoN} photos`);
  } else {
    reasons.push("Few photos — completeness lower");
  }
  if (amenityN >= 8) {
    score += 20;
    reasons.push(`${amenityN} amenities listed`);
  } else if (amenityN >= 3) {
    score += 10;
  }
  if (descN >= 400) {
    score += 20;
    reasons.push("Long-form description present");
  } else if (descN >= 120) {
    score += 10;
  }

  return { qualityScore: Math.min(100, score), reasons };
}
