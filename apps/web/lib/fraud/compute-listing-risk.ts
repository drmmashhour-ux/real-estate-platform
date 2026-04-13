import { prisma } from "@/lib/db";
import { BAIT_NIGHT_PRICE_CENTS, MAX_LISTINGS_PER_OWNER_PER_DAY, POINTS } from "@/lib/fraud/rules";
import { recordFraudSignal } from "@/lib/fraud/record-signal";
import { duplicateUrlCount } from "@/lib/fraud/validators";

export async function evaluateListingFraudAfterCreate(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      nightPriceCents: true,
      photos: true,
      title: true,
      listingStatus: true,
    },
  });
  if (!listing) return;

  if (listing.nightPriceCents > 0 && listing.nightPriceCents < BAIT_NIGHT_PRICE_CENTS) {
    await recordFraudSignal({
      entityType: "listing",
      entityId: listing.id,
      signalType: "suspicious_low_night_price",
      riskPoints: POINTS.listing_price_bait,
      metadataJson: { nightPriceCents: listing.nightPriceCents },
    });
  }

  const photos = Array.isArray(listing.photos) ? listing.photos.filter((p): p is string => typeof p === "string") : [];
  const dupes = duplicateUrlCount(photos);
  if (dupes >= 2) {
    await recordFraudSignal({
      entityType: "listing",
      entityId: listing.id,
      signalType: "duplicate_listing_images",
      riskPoints: POINTS.duplicate_image_hash,
      metadataJson: { duplicateUrlCount: dupes },
    });
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.shortTermListing.count({
    where: { ownerId: listing.ownerId, createdAt: { gte: dayAgo } },
  });
  if (count > MAX_LISTINGS_PER_OWNER_PER_DAY) {
    await recordFraudSignal({
      entityType: "listing",
      entityId: listing.id,
      signalType: "listing_volume_spike_owner",
      riskPoints: POINTS.listing_volume_spam,
      metadataJson: { listings24h: count },
    });
  }
}
