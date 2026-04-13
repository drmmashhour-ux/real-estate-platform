import { ListingAnalyticsKind, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type HostListingManageRow = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  listingStatus: ListingStatus;
  nightPriceCents: number;
  coverUrl: string | null;
  views: number;
  bookings: number;
  /** For sort / “recently updated” in host grid */
  updatedAt: Date;
  /** Heuristic occupancy label */
  occupancyLabel: string;
  /** AI-style badges for host grid */
  aiBadges: string[];
};

export async function getHostListings(hostId: string): Promise<HostListingManageRow[]> {
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      listingCode: true,
      title: true,
      city: true,
      listingStatus: true,
      nightPriceCents: true,
      updatedAt: true,
      description: true,
      bnhubListingCompletedStays: true,
      listingPhotos: { take: 8, orderBy: { sortOrder: "asc" }, select: { url: true } },
      photos: true,
    },
  });

  const ids = listings.map((l) => l.id);
  const analytics = ids.length
    ? await prisma.listingAnalytics.findMany({
        where: { kind: ListingAnalyticsKind.BNHUB, listingId: { in: ids } },
      })
    : [];
  const aMap = new Map(analytics.map((a) => [a.listingId, a]));

  return listings.map((l) => {
    const a = aMap.get(l.id);
    const views = a?.viewsTotal ?? 0;
    const bookings = a?.bookings ?? l.bnhubListingCompletedStays ?? 0;
    const cover =
      l.listingPhotos[0]?.url ??
      (Array.isArray(l.photos) && typeof l.photos[0] === "string" ? l.photos[0] : null);
    const occ =
      views > 0
        ? `${(Math.min(99, (Math.round((bookings / Math.max(views, 1)) * 1000) / 10)))}% conv.`
        : "—";
    const descLen = l.description?.trim().length ?? 0;
    const photoCount = l.listingPhotos.length;
    const aiBadges: string[] = [];
    if (l.nightPriceCents > 0 && l.nightPriceCents < 8000) aiBadges.push("Underpriced");
    if (views > 50 && bookings > 2) aiBadges.push("High demand");
    if (views > 30 && bookings === 0) aiBadges.push("Low conversion");
    if (photoCount < 5) aiBadges.push("Needs photos");
    if (descLen < 120) aiBadges.push("Needs description");
    return {
      id: l.id,
      listingCode: l.listingCode,
      title: l.title,
      city: l.city,
      listingStatus: l.listingStatus,
      nightPriceCents: l.nightPriceCents,
      updatedAt: l.updatedAt,
      coverUrl: cover,
      views,
      bookings,
      occupancyLabel: occ,
      aiBadges,
    };
  });
}
