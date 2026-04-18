import { prisma } from "@/lib/db";
import { countListingAmenities, countListingPhotos } from "@/lib/bnhub/ranking/listing-ranking";

/** 0–100 from title/description/amenities/photos — deterministic. */
export async function computeListingCompletenessScore(listingId: string): Promise<number> {
  const l = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      title: true,
      description: true,
      photos: true,
      amenities: true,
      listingPhotos: { select: { id: true } },
    },
  });
  if (!l) return 0;

  const photoN = Math.max(countListingPhotos(l.photos), l.listingPhotos.length);
  const amenityN = countListingAmenities(l.amenities);
  const titleLen = (l.title ?? "").trim().length;
  const descLen = (l.description ?? "").trim().length;

  let s = 0;
  if (titleLen >= 12) s += 15;
  if (descLen >= 400) s += 35;
  else if (descLen >= 120) s += 22;
  else if (descLen >= 40) s += 10;
  if (photoN >= 8) s += 30;
  else if (photoN >= 4) s += 22;
  else if (photoN >= 1) s += 12;
  if (amenityN >= 10) s += 20;
  else if (amenityN >= 5) s += 12;
  else if (amenityN >= 1) s += 5;

  return Math.min(100, s);
}
