/**
 * Daily trend by **booking.createdAt** (UTC day bucket) — “when bookings were recorded”, not guest stay nights.
 * Uses live `Booking.totalCents` sums per creation day.
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addUtcDays, round2, startOfUtcDay } from "./bnhub-revenue-math";
import { BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES } from "./bnhub-revenue-booking-filters";

export type DailyRevenueTrendRow = {
  date: string;
  revenue: number;
  bookings: number;
  nights: number;
};

export async function getDailyRevenueTrend(hostUserId: string, days = 30): Promise<DailyRevenueTrendRow[]> {
  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostUserId, listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
  });
  const ids = listings.map((l) => l.id);
  if (ids.length === 0) return [];

  const today = startOfUtcDay(new Date());
  const windowStart = addUtcDays(today, -(days - 1));
  const windowEndExclusive = addUtcDays(today, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      listingId: { in: ids },
      createdAt: { gte: windowStart, lt: windowEndExclusive },
      status: { notIn: BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES },
    },
    select: { createdAt: true, totalCents: true, nights: true },
  });

  const buckets = new Map<string, { revenueCents: number; count: number; nights: number }>();
  for (let i = 0; i < days; i++) {
    const d = addUtcDays(windowStart, i);
    buckets.set(d.toISOString().slice(0, 10), { revenueCents: 0, count: 0, nights: 0 });
  }

  for (const b of bookings) {
    const key = startOfUtcDay(b.createdAt).toISOString().slice(0, 10);
    const row = buckets.get(key);
    if (!row) continue;
    row.revenueCents += b.totalCents;
    row.count += 1;
    row.nights += b.nights;
  }

  const rows: DailyRevenueTrendRow[] = [];
  for (let i = 0; i < days; i++) {
    const d = addUtcDays(windowStart, i);
    const key = d.toISOString().slice(0, 10);
    const v = buckets.get(key)!;
    rows.push({
      date: key,
      revenue: round2(v.revenueCents / 100),
      bookings: v.count,
      nights: v.nights,
    });
  }

  return rows;
}
