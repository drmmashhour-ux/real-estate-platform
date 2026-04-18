import { prisma } from "@/lib/db";
import { countListingPhotos } from "@/lib/bnhub/ranking/listing-ranking";

/** 0–100 — photo coverage + approved images flag when present. */
export async function computeListingMediaScore(listingId: string): Promise<number> {
  const l = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      photos: true,
      listingPhotos: { select: { id: true } },
      imagesApproved: true,
      missingApprovedImages: true,
    },
  });
  if (!l) return 0;

  const n = Math.max(countListingPhotos(l.photos), l.listingPhotos.length);
  let s = 0;
  if (n >= 10) s = 85;
  else if (n >= 6) s = 70;
  else if (n >= 3) s = 50;
  else if (n >= 1) s = 30;

  if (l.imagesApproved && !l.missingApprovedImages) s = Math.min(100, s + 10);
  return Math.min(100, s);
}
