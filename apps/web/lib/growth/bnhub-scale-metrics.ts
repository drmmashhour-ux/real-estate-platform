import { BookingStatus, ListingStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

function rangeStart(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(1, Math.min(365, days)));
  return d;
}

/** BNHUB marketplace KPIs for 1K → 10K scaling dashboard. */
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

  const [guestGmvAgg, guestFeeAgg, guestUpsellAgg, guestPaidBookingCount] = await Promise.all([
    prisma.platformRevenueEvent.aggregate({
      where: {
        createdAt: { gte: start },
        status: "realized",
        revenueType: "bnhub_guest_booking_gmv",
      },
      _sum: { amountCents: true },
    }),
    prisma.platformRevenueEvent.aggregate({
      where: {
        createdAt: { gte: start },
        status: "realized",
        revenueType: "bnhub_guest_booking_service_fee",
      },
      _sum: { amountCents: true },
    }),
    prisma.platformRevenueEvent.aggregate({
      where: {
        createdAt: { gte: start },
        status: "realized",
        revenueType: "bnhub_guest_booking_upsell",
      },
      _sum: { amountCents: true },
    }),
    prisma.platformRevenueEvent.count({
      where: {
        createdAt: { gte: start },
        status: "realized",
        revenueType: "bnhub_guest_booking_gmv",
      },
    }),
  ]);

  const guestGmvCents = guestGmvAgg._sum.amountCents ?? 0;
  const guestPlatformRevenueCents =
    (guestFeeAgg._sum.amountCents ?? 0) + (guestUpsellAgg._sum.amountCents ?? 0);
  const guestAvgBookingGmvCents =
    guestPaidBookingCount > 0 ? Math.round(guestGmvCents / guestPaidBookingCount) : null;

  const guestBookingsWithUpsell = await prisma.platformRevenueEvent.count({
    where: {
      createdAt: { gte: start },
      status: "realized",
      revenueType: "bnhub_guest_booking_upsell",
      amountCents: { gt: 0 },
    },
  });
  const guestUpsellAttachRateComputed =
    guestPaidBookingCount > 0 ? guestBookingsWithUpsell / guestPaidBookingCount : null;

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
    /** Supabase guest stays settled via Stripe (`recordBnhubGuestBookingRevenueFromPaidSession`). */
    guestSupabaseStripe: {
      paidBookingsInPeriod: guestPaidBookingCount,
      gmvCentsInPeriod: guestGmvCents,
      avgGmvPerBookingCents: guestAvgBookingGmvCents,
      platformRevenueCentsInPeriod: guestPlatformRevenueCents,
      upsellRevenueCentsInPeriod: guestUpsellAgg._sum.amountCents ?? 0,
      upsellAttachRate: guestUpsellAttachRateComputed,
    },
    supplyByCity: citySupply.map((c) => ({
      city: c.city,
      publishedListings: c._count.id,
    })),
  };
}
