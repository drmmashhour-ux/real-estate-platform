import { ListingStatus, SearchEventType } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SimilarListingCard } from "./cards";
import { toSimilarListingCards } from "./cards";

const WINDOW_DAYS = 60;

/**
 * Continue browsing — recent BNHub listing views (search events + activity log fallback).
 */
export async function getRecentlyViewedBnhubListings(
  userId: string | null,
  limit = 8
): Promise<SimilarListingCard[]> {
  if (!userId) return [];
  const since = new Date(Date.now() - WINDOW_DAYS * 86400000);

  const fromSearch = await prisma.searchEvent.findMany({
    where: {
      userId,
      listingId: { not: null },
      eventType: { in: [SearchEventType.VIEW, SearchEventType.CLICK] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { listingId: true },
  });

  let ids = [...new Set(fromSearch.map((e) => e.listingId).filter((x): x is string => Boolean(x)))];

  if (ids.length < 4) {
    const fromActivity = await prisma.aiUserActivityLog.findMany({
      where: { userId, eventType: "listing_view", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { listingId: true },
    });
    const extra = fromActivity
      .map((a) => a.listingId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
    ids = [...new Set([...ids, ...extra])];
  }

  if (ids.length === 0) return [];

  const rows = await prisma.shortTermListing.findMany({
    where: { id: { in: ids.slice(0, limit * 2) }, listingStatus: ListingStatus.PUBLISHED },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      country: true,
      beds: true,
      baths: true,
      nightPriceCents: true,
      propertyType: true,
      photos: true,
      listingPhotos: {
        take: 1,
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select: { url: true },
      },
    },
  });
  const order = new Map(ids.map((id, i) => [id, i] as const));
  rows.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  return toSimilarListingCards(rows.slice(0, limit));
}
