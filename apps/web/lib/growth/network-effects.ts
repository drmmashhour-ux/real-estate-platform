import { BookingStatus, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Network-effect signals: supply ↔ demand flywheel.
 * Use for admin ranking, campaigns, and “top host” surfaces — see docs/100k-domination-system.md.
 */

const SUCCESS: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

function bookingSuccessWhere(since: Date): Prisma.BookingWhereInput {
  return {
    createdAt: { gte: since },
    status: { in: SUCCESS },
  };
}

/** Listings with recent booking velocity (proxy for guest demand converting). */
export async function getActiveListingIdsByBookings(limit = 24, days = 30): Promise<string[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const grouped = await prisma.booking.groupBy({
    by: ["listingId"],
    where: bookingSuccessWhere(since),
    _count: { id: true },
    orderBy: { _count: { listingId: "desc" } },
    take: limit,
  });

  return grouped.map((g) => g.listingId);
}

/** Hosts ranked by confirmed/completed bookings in window (for “promote high performers”). */
export async function getTopHostIdsByBookings(limit = 15, days = 90): Promise<{ hostId: string; bookings: number }[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const rows = await prisma.booking.findMany({
    where: bookingSuccessWhere(since),
    select: {
      listing: { select: { ownerId: true } },
    },
  });

  const tally = new Map<string, number>();
  for (const r of rows) {
    const id = r.listing.ownerId;
    tally.set(id, (tally.get(id) ?? 0) + 1);
  }

  return [...tally.entries()]
    .map(([hostId, bookings]) => ({ hostId, bookings }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, limit);
}

export type NetworkEffectSnapshot = {
  publishedListings: number;
  bookingsLast30d: number;
  bookingsPerThousandListings: number | null;
};

export async function getNetworkEffectSnapshot(): Promise<NetworkEffectSnapshot> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  const [publishedListings, bookingsLast30d] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.booking.count({
      where: bookingSuccessWhere(since),
    }),
  ]);

  const bookingsPerThousandListings =
    publishedListings > 0 ? Math.round((bookingsLast30d / publishedListings) * 1000) : null;

  return { publishedListings, bookingsLast30d, bookingsPerThousandListings };
}
