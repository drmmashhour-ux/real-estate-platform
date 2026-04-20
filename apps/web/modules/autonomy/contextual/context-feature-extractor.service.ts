import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getListingRevenueMetrics, getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import { BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES } from "@/modules/bnhub-revenue/bnhub-revenue-booking-filters";
import {
  bucketAdr,
  bucketBookings,
  bucketOccupancy,
  bucketPriceTier,
  bucketRevpar,
  bucketSeason,
  bucketTrend,
  bucketWeekendBias,
} from "./context-buckets";
import type { ContextFeatures } from "./context.types";

function computeWeekendBiasFromBookings(bookings: { checkIn: Date }[]) {
  if (!bookings.length) return 0.5;

  let weekendStarts = 0;
  for (const booking of bookings) {
    const d = new Date(booking.checkIn);
    const day = d.getUTCDay();
    if (day === 5 || day === 6) weekendStarts += 1;
  }

  return weekendStarts / bookings.length;
}

function computeSimpleTrend(first: number, last: number) {
  if (!first && !last) return 0;
  if (!first) return 1;
  return (last - first) / first;
}

/** Listing-only daily revenue trend (booking.createdAt buckets), deterministic. */
async function listingCreationRevenueTrend(listingId: string, days: number) {
  const today = startOfUtcDay(new Date());
  const windowStart = addUtcDays(today, -(days - 1));
  const windowEndExclusive = addUtcDays(today, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      createdAt: { gte: windowStart, lt: windowEndExclusive },
      status: { notIn: BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES },
    },
    select: { createdAt: true, totalCents: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = addUtcDays(windowStart, i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const b of bookings) {
    const key = startOfUtcDay(b.createdAt).toISOString().slice(0, 10);
    const row = buckets.get(key);
    if (row === undefined) continue;
    buckets.set(key, row + b.totalCents / 100);
  }

  const dates = [...buckets.keys()].sort();
  const revenues = dates.map((k) => buckets.get(k) ?? 0);
  const bookingCounts = dates.map((k) =>
    bookings.filter((b) => startOfUtcDay(b.createdAt).toISOString().slice(0, 10) === k).length
  );
  const firstTrend = revenues[0] ?? 0;
  const lastTrend = revenues[revenues.length - 1] ?? 0;
  const firstOcc = bookingCounts[0] ?? 0;
  const lastOcc = bookingCounts[bookingCounts.length - 1] ?? 0;

  return {
    revenueTrend: computeSimpleTrend(firstTrend, lastTrend),
    occupancyTrend: computeSimpleTrend(firstOcc, lastOcc),
  };
}

export async function extractContextFeatures(scopeType: string, scopeId: string): Promise<ContextFeatures> {
  const now = new Date();

  if (scopeType === "portfolio") {
    const [summary, trend, listings] = await Promise.all([
      getRevenueDashboardSummary(scopeId),
      getDailyRevenueTrend(scopeId, 14),
      prisma.shortTermListing.findMany({
        where: { ownerId: scopeId, listingStatus: ListingStatus.PUBLISHED },
        select: {
          bookings: {
            select: { checkIn: true },
          },
        },
      }),
    ]);

    const p = summary.portfolio;
    const firstTrend = trend[0]?.revenue ?? 0;
    const lastTrend = trend[trend.length - 1]?.revenue ?? 0;
    const revenueTrend = computeSimpleTrend(firstTrend, lastTrend);

    const firstOcc = trend[0]?.bookings ?? 0;
    const lastOcc = trend[trend.length - 1]?.bookings ?? 0;
    const occupancyTrend = computeSimpleTrend(firstOcc, lastOcc);

    const allBookings = listings.flatMap((l) => l.bookings ?? []);
    const weekendBias = computeWeekendBiasFromBookings(allBookings);

    const adr = Number(p.adr ?? 0);

    return {
      occupancyBucket: bucketOccupancy(Number(p.occupancyRate ?? 0)),
      adrBucket: bucketAdr(adr),
      revparBucket: bucketRevpar(Number(p.revpar ?? 0)),
      bookingBucket: bucketBookings(Number(p.bookingCount ?? 0)),
      revenueTrendBucket: bucketTrend(revenueTrend),
      occupancyTrendBucket: bucketTrend(occupancyTrend),
      weekendBiasBucket: bucketWeekendBias(weekendBias),
      seasonBucket: bucketSeason(now),
      priceTierBucket: bucketPriceTier(adr),
    };
  }

  if (scopeType === "listing") {
    const today = startOfUtcDay(new Date());
    const startRange = addUtcDays(today, -29);

    const [live, listingRows, trends] = await Promise.all([
      getListingRevenueMetrics(scopeId, { start: startRange, end: today }),
      prisma.shortTermListing.findUnique({
        where: { id: scopeId },
        select: {
          bookings: {
            select: { checkIn: true },
          },
        },
      }),
      listingCreationRevenueTrend(scopeId, 14),
    ]);

    const occupancyRate = live?.occupancyRate ?? 0;
    const adr = live?.adr ?? 0;
    const revpar = live?.revpar ?? 0;
    const bookingCount = live?.bookingCount ?? 0;

    const weekendBias = computeWeekendBiasFromBookings(listingRows?.bookings ?? []);

    return {
      occupancyBucket: bucketOccupancy(occupancyRate),
      adrBucket: bucketAdr(adr),
      revparBucket: bucketRevpar(revpar),
      bookingBucket: bucketBookings(bookingCount),
      revenueTrendBucket: bucketTrend(trends.revenueTrend),
      occupancyTrendBucket: bucketTrend(trends.occupancyTrend),
      weekendBiasBucket: bucketWeekendBias(weekendBias),
      seasonBucket: bucketSeason(now),
      priceTierBucket: bucketPriceTier(adr),
    };
  }

  return {
    occupancyBucket: "medium",
    adrBucket: "mid",
    revparBucket: "medium",
    bookingBucket: "low",
    revenueTrendBucket: "flat",
    occupancyTrendBucket: "flat",
    weekendBiasBucket: "balanced",
    seasonBucket: bucketSeason(now),
    priceTierBucket: "mid",
  };
}
