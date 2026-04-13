import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampInt } from "@/lib/quality/validators";

export type ContentScoreResult = {
  score: number;
  detail: Prisma.InputJsonValue;
};

export async function computeContentScoreComponent(listingId: string): Promise<ContentScoreResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      description: true,
      amenities: true,
      photos: true,
      listingPhotos: { select: { id: true } },
    },
  });
  if (!listing) {
    return { score: 0, detail: { error: "listing_not_found" } };
  }

  const titleLen = listing.title.trim().length;
  const descLen = (listing.description ?? "").trim().length;
  const amenities = Array.isArray(listing.amenities) ? listing.amenities : [];
  const amenityCount = amenities.filter((a): a is string => typeof a === "string").length;
  const legacyPhotos = Array.isArray(listing.photos) ? listing.photos.filter((p): p is string => typeof p === "string") : [];
  const photoCount = listing.listingPhotos.length > 0 ? listing.listingPhotos.length : legacyPhotos.length;

  let pts = 0;
  if (titleLen >= 18 && titleLen <= 120) pts += 22;
  else if (titleLen >= 10) pts += 14;
  else pts += 6;

  if (descLen >= 400) pts += 28;
  else if (descLen >= 180) pts += 20;
  else if (descLen >= 60) pts += 12;
  else pts += 4;

  if (amenityCount >= 10) pts += 22;
  else if (amenityCount >= 5) pts += 16;
  else if (amenityCount >= 2) pts += 10;
  else pts += 4;

  if (photoCount >= 8) pts += 28;
  else if (photoCount >= 5) pts += 22;
  else if (photoCount >= 3) pts += 14;
  else if (photoCount >= 1) pts += 8;
  else pts += 0;

  const score = clampInt(pts, 0, 100);
  return {
    score,
    detail: {
      titleLen,
      descLen,
      amenityCount,
      photoCount,
      engine: "listing_content_v1",
    } as Prisma.InputJsonValue,
  };
}
