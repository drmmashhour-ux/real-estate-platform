import { prisma } from "@/lib/db";
import { computeSy8FeedRankScore, countPersistedListingImages } from "@/lib/sy8/sy8-feed-rank-compute";
import { computeSybnbBrowseTier } from "@/lib/sybnb/sybnb-browse-tier";
import { computeSybn113ViralityTrustBoost } from "@/lib/syria/share-abuse";

/**
 * Recompute and persist `sy8FeedRankScore` and `sybnbBrowseTier` for one listing (call after location edits, trust/plan changes, or new booking).
 *
 * ORDER SYBNB-51 / SYBNB-65 — score blends trust, amenities, photos, listing quality, engagement, plan, freshness (`computeSy8FeedRankScore`).
 */
export async function recomputeSy8FeedRankForPropertyId(propertyId: string): Promise<void> {
  const id = propertyId.trim();
  if (!id) return;

  const [p, sybnbRequested, sybnbCompleted, syriaPending, syriaCompleted, contactClicks, viralityBoost] =
    await Promise.all([
      prisma.syriaProperty.findUnique({
        where: { id },
        include: { owner: true },
      }),
      prisma.sybnbBooking.count({ where: { listingId: id, status: "requested" } }),
      prisma.sybnbBooking.count({ where: { listingId: id, status: "completed" } }),
      prisma.syriaBooking.count({ where: { propertyId: id, status: "PENDING" } }),
      prisma.syriaBooking.count({ where: { propertyId: id, status: "COMPLETED" } }),
      prisma.sybnbEvent.count({
        where: {
          listingId: id,
          type: { in: ["contact_click", "hotel_contact_click", "phone_reveal"] },
        },
      }),
      computeSybn113ViralityTrustBoost(id),
    ]);

  if (!p) return;

  const score = computeSy8FeedRankScore({
    property: p,
    owner: p.owner,
    engagement: {
      contactClicks,
      bookingRequests: sybnbRequested + syriaPending,
      completedBookings: sybnbCompleted + syriaCompleted,
    },
    sybn113ViralityTrustBoost: viralityBoost,
  });
  const tier = computeSybnbBrowseTier(p);
  const listingPhotoCount = countPersistedListingImages(p.images);

  if (p.sy8FeedRankScore === score && p.sybnbBrowseTier === tier && p.listingPhotoCount === listingPhotoCount) return;

  await prisma.syriaProperty.update({
    where: { id },
    data: { sy8FeedRankScore: score, sybnbBrowseTier: tier, listingPhotoCount },
  });
}
