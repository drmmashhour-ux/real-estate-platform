import { BookingStatus, ListingStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

function rangeStart(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(1, Math.min(365, days)));
  return d;
}

/** BNHub marketplace KPIs for 1K → 10K scaling dashboard. */
export async function getBnhubScaleMetrics(days = 30) {
  const start = rangeStart(days);
  const bookingSuccess: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

  const [
    listingsPublished,
    listingsDraft,
    hosts,
    guestUsers,
    bookingsInPeriod,
    bookingAgg,
    signupsTraffic,
  ] = await Promise.all([
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.DRAFT } }),
    prisma.user.count({ where: { role: PlatformRole.HOST } }),
    prisma.user.count({
      where: { role: { in: [PlatformRole.USER, PlatformRole.CLIENT] } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: start },
        status: { in: [...bookingSuccess] },
      },
    }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: start },
        status: { in: [...bookingSuccess] },
      },
      _sum: { totalCents: true },
      _avg: { totalCents: true },
    }),
    prisma.trafficEvent.count({
      where: { eventType: "signup_completed", createdAt: { gte: start } },
    }),
  ]);

  const citySupply = await prisma.shortTermListing.groupBy({
    by: ["city"],
    where: { listingStatus: ListingStatus.PUBLISHED },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 40,
  });

  return {
    rangeDays: days,
    since: start.toISOString(),
    users: {
      hosts,
      guestUsers,
      signupsInPeriod: signupsTraffic,
    },
    listings: {
      published: listingsPublished,
      draft: listingsDraft,
    },
    bookings: {
      confirmedOrCompletedInPeriod: bookingsInPeriod,
      gmvCentsInPeriod: bookingAgg._sum.totalCents ?? 0,
      avgBookingValueCents: bookingAgg._avg.totalCents
        ? Math.round(bookingAgg._avg.totalCents)
        : null,
    },
    supplyByCity: citySupply.map((c) => ({
      city: c.city,
      publishedListings: c._count.id,
    })),
  };
}
