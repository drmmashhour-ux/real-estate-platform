import { BookingStatus, ListingStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

function rangeStart(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(1, Math.min(365, days)));
  return d;
}

const BOOKING_OK: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

export type RegionListingsRow = { country: string; published: number; draft: number };
export type RegionBookingsRow = { country: string; bookings: number; gmvCents: number };

/**
 * Enterprise dashboard — regional rollup where `ShortTermListing.country` is the primary geo key.
 * Users are global counts; refine with profile/address fields when available.
 */
export async function getEnterpriseMetrics(days = 30) {
  const start = rangeStart(days);

  const [
    listingsByCountry,
    hosts,
    guestUsers,
    signupsPeriod,
    bookingsPeriod,
    bookingGmv,
  ] = await Promise.all([
    prisma.shortTermListing.groupBy({
      by: ["country", "listingStatus"],
      _count: { id: true },
    }).catch(() => [] as { listingStatus: ListingStatus; country: string; _count: { id: number } }[]),
    prisma.user.count({ where: { role: PlatformRole.HOST } }),
    prisma.user.count({ where: { role: { in: [PlatformRole.USER, PlatformRole.CLIENT] } } }),
    prisma.trafficEvent.count({
      where: { eventType: "signup_completed", createdAt: { gte: start } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: start }, status: { in: BOOKING_OK } },
    }),
    prisma.booking.aggregate({
      where: { createdAt: { gte: start }, status: { in: BOOKING_OK } },
      _sum: { totalCents: true },
    }),
  ]);

  // Prisma groupBy with two fields returns combined groups — reshape to published/draft per country
  const countryMap = new Map<string, { published: number; draft: number }>();
  for (const row of listingsByCountry as { listingStatus: ListingStatus; country: string; _count: { id: number } }[]) {
    const c = row.country || "unknown";
    if (!countryMap.has(c)) countryMap.set(c, { published: 0, draft: 0 });
    const m = countryMap.get(c)!;
    if (row.listingStatus === ListingStatus.PUBLISHED) m.published += row._count.id;
    if (row.listingStatus === ListingStatus.DRAFT) m.draft += row._count.id;
  }

  const listingsByRegion: RegionListingsRow[] = [...countryMap.entries()]
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.published - a.published);

  const bookMap = new Map<string, { bookings: number; gmvCents: number }>();
  const batchSize = 2500;
  let cursor: string | undefined;
  for (;;) {
    const batchRows = await prisma.booking.findMany({
      where: { createdAt: { gte: start }, status: { in: BOOKING_OK } },
      select: { id: true, totalCents: true, listing: { select: { country: true } } },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (batchRows.length === 0) break;
    for (const b of batchRows) {
      const c = b.listing.country || "unknown";
      if (!bookMap.has(c)) bookMap.set(c, { bookings: 0, gmvCents: 0 });
      const m = bookMap.get(c)!;
      m.bookings += 1;
      m.gmvCents += b.totalCents;
    }
    cursor = batchRows[batchRows.length - 1].id;
    if (batchRows.length < batchSize) break;
  }

  const bookingsByRegion: RegionBookingsRow[] = [...bookMap.entries()]
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.gmvCents - a.gmvCents);

  const repeatGuests = await prisma.booking.groupBy({
    by: ["guestId"],
    where: { createdAt: { gte: start }, status: { in: BOOKING_OK } },
    _count: { id: true },
  });
  const repeatBookingGuests = repeatGuests.filter((g) => g._count.id >= 2).length;

  return {
    rangeDays: days,
    since: start.toISOString(),
    users: {
      hosts,
      guestUsers,
      signupsInPeriod: signupsPeriod,
    },
    listingsByRegion,
    bookings: {
      totalInPeriod: bookingsPeriod,
      gmvCentsInPeriod: bookingGmv._sum.totalCents ?? 0,
    },
    bookingsByRegion,
    retention: {
      guestsWithBookingsInPeriod: repeatGuests.length,
      guestsWithTwoPlusBookingsInPeriod: repeatBookingGuests,
    },
  };
}
