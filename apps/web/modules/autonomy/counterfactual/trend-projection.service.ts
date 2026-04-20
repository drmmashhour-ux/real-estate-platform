import { prisma } from "@/lib/db";
import type { DailyRevenueTrendRow } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { BNHUB_REVENUE_EXCLUDED_BOOKING_STATUSES } from "@/modules/bnhub-revenue/bnhub-revenue-booking-filters";
import { addUtcDays, round2, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import type { CounterfactualExpectedMetrics } from "./counterfactual.types";
import { average, linearProjection, round4 } from "./counterfactual-math";

/** Listing-scoped daily series (booking.createdAt), same semantics as host trend service. */
async function listingDailyTrendRows(listingId: string, days: number): Promise<DailyRevenueTrendRow[]> {
  const today = startOfUtcDay(new Date());
  const windowStart = addUtcDays(today, -(days - 1));
  const windowEndExclusive = addUtcDays(today, 1);

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
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

export async function estimateCounterfactualFromTrend(
  scopeType: string,
  scopeId: string,
  baselineWindowDays = 14
): Promise<CounterfactualExpectedMetrics> {
  const trend =
    scopeType === "portfolio"
      ? await getDailyRevenueTrend(scopeId, baselineWindowDays)
      : scopeType === "listing"
        ? await listingDailyTrendRows(scopeId, baselineWindowDays)
        : [];

  if (!trend.length) {
    return {
      revenue: 0,
      occupancy: 0,
      bookings: 0,
      adr: 0,
      revpar: 0,
    };
  }

  const firstRevenue = Number(trend[0]?.revenue || 0);
  const lastRevenue = Number(trend[trend.length - 1]?.revenue || 0);

  const revenue = round4(linearProjection(firstRevenue, lastRevenue, 0.5));
  const bookings = round4(average(trend.map((x) => Number(x.bookings || 0))));
  const nights = average(trend.map((x) => Number(x.nights || 0)));

  const adr = nights > 0 ? round4(revenue / Math.max(nights, 1)) : 0;
  const revpar = trend.length > 0 ? round4(revenue / Math.max(trend.length, 1)) : 0;
  const occupancy = round4(Math.min(1, Math.max(0, nights / Math.max(trend.length, 1))));

  return {
    revenue,
    occupancy,
    bookings,
    adr,
    revpar,
  };
}
