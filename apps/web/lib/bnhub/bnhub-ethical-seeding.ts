import { SearchEventType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { countBnhubListingViewsToday } from "@/lib/bnhub/bnhub-listing-urgency";

function startOfUtcWeek(): Date {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // Monday start
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Persists a real public stay detail view (increments counters + `search_events` VIEW for “today” rollups). */
export async function recordBnhubStayPublicView(listingId: string, userId: string | null): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.shortTermListing.update({
        where: { id: listingId },
        data: {
          bnhubLastViewedAt: new Date(),
          bnhubListingViewCount: { increment: 1 },
        },
      }),
      prisma.searchEvent.create({
        data: {
          listingId,
          userId: userId ?? undefined,
          eventType: SearchEventType.VIEW,
          metadata: { source: "bnhub_stay_public" } as Prisma.InputJsonValue,
        },
      }),
    ]);
  } catch {
    /* never block page render */
  }
}

export async function syncBnhubListingWishlistCount(listingId: string): Promise<number> {
  const c = await prisma.bnhubGuestFavorite.count({ where: { listingId } });
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { bnhubWishlistCount: c },
  });
  return c;
}

export async function countBnhubWishlistAddsThisWeek(listingId: string): Promise<number> {
  return prisma.bnhubGuestFavorite.count({
    where: {
      listingId,
      createdAt: { gte: startOfUtcWeek() },
    },
  });
}

export type BnhubListingEthicalSignals = {
  viewsToday: number;
  savesThisWeek: number;
  lifetimeViews: number;
  wishlistTotal: number;
  lastViewedAt: Date | null;
};

export async function getBnhubListingEthicalSignals(listingId: string): Promise<BnhubListingEthicalSignals> {
  const [viewsToday, savesThisWeek, row] = await Promise.all([
    countBnhubListingViewsToday(listingId),
    countBnhubWishlistAddsThisWeek(listingId),
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        bnhubListingViewCount: true,
        bnhubWishlistCount: true,
        bnhubLastViewedAt: true,
      },
    }),
  ]);
  return {
    viewsToday,
    savesThisWeek,
    lifetimeViews: row?.bnhubListingViewCount ?? 0,
    wishlistTotal: row?.bnhubWishlistCount ?? 0,
    lastViewedAt: row?.bnhubLastViewedAt ?? null,
  };
}
