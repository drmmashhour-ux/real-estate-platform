import { ListingStatus, SearchEventType, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RecentlyViewedListingCard = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  listingCode: string | null;
  coverUrl: string | null;
};

/**
 * Distinct BNHUB listings the guest opened recently (from `search_events` VIEW), most recent first.
 */
export async function getRecentlyViewedBnhubListings(
  guestUserId: string,
  limit: number,
): Promise<RecentlyViewedListingCard[]> {
  const events = await prisma.searchEvent.findMany({
    where: {
      userId: guestUserId,
      eventType: SearchEventType.VIEW,
      listingId: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(120, Math.max(limit * 8, limit)),
    select: { listingId: true },
  });

  const seen = new Set<string>();
  const orderedIds: string[] = [];
  for (const e of events) {
    const id = e.listingId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    orderedIds.push(id);
    if (orderedIds.length >= limit) break;
  }

  if (orderedIds.length === 0) return [];

  const listings = await prisma.shortTermListing.findMany({
    where: {
      id: { in: orderedIds },
      listingStatus: ListingStatus.PUBLISHED,
      verificationStatus: VerificationStatus.VERIFIED,
    },
    select: {
      id: true,
      title: true,
      city: true,
      nightPriceCents: true,
      listingCode: true,
      listingPhotos: { take: 1, select: { url: true } },
      photos: true,
    },
  });

  const byId = new Map(listings.map((l) => [l.id, l]));
  const out: RecentlyViewedListingCard[] = [];
  for (const id of orderedIds) {
    const l = byId.get(id);
    if (!l) continue;
    const rawPhotos = l.listingPhotos[0]?.url ?? (Array.isArray(l.photos) && typeof l.photos[0] === "string" ? l.photos[0] : null);
    out.push({
      id: l.id,
      title: l.title,
      city: l.city,
      nightPriceCents: l.nightPriceCents,
      listingCode: l.listingCode,
      coverUrl: rawPhotos,
    });
  }
  return out;
}
