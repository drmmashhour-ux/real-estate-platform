import "server-only";

import { CACHE_KEYS, getCached } from "@/lib/cache";
import { getListingsDB } from "@/lib/db/routeSwitch";

const db = () => getListingsDB();

export type InvestorMetrics = {
  gmvCents: number;
  platformRevenueCents: number;
  netRevenueCents: number;
  totalBookings: number;
  totalNights: number;
  averageBookingValueCents: number;
  averageDailyRateCents: number;
  refundCents: number;
};

/**
 * Order 61 — confirmed marketplace rows with price snapshots. Net revenue: platform fee minus
 * fee share of refunds (proportional to `refundedAmountCents / finalCents` when &gt; 0).
 */
export async function getInvestorMetrics(): Promise<InvestorMetrics> {
  const rows = await db().booking.findMany({
    where: { status: "confirmed" },
    select: {
      finalCents: true,
      feeCents: true,
      subtotalCents: true,
      nights: true,
      refundedAmountCents: true,
    },
  });

  let gmvCents = 0;
  let platformRevenueCents = 0;
  let netRevenueCents = 0;
  let totalNights = 0;
  let refundCents = 0;
  let countPriced = 0;
  const totalBookings = rows.length;

  for (const r of rows) {
    if (r.nights != null && r.nights > 0) {
      totalNights += r.nights;
    }
    const final = r.finalCents;
    if (final == null || final <= 0) continue;
    countPriced += 1;
    gmvCents += final;
    const fee = r.feeCents ?? 0;
    platformRevenueCents += fee;
    const ref = r.refundedAmountCents ?? 0;
    refundCents += ref;
    if (ref > 0 && final > 0) {
      const ratio = Math.min(1, ref / final);
      netRevenueCents += Math.max(0, Math.round(fee * (1 - ratio)));
    } else {
      netRevenueCents += fee;
    }
  }

  const averageBookingValueCents = countPriced > 0 ? Math.round(gmvCents / countPriced) : 0;
  let subSum = 0;
  let nSum = 0;
  for (const r of rows) {
    if (r.subtotalCents == null || r.nights == null || r.nights <= 0) continue;
    subSum += r.subtotalCents;
    nSum += r.nights;
  }
  const averageDailyRateCents = nSum > 0 ? Math.round(subSum / nSum) : 0;

  return {
    gmvCents,
    platformRevenueCents,
    netRevenueCents,
    totalBookings,
    totalNights,
    averageBookingValueCents,
    averageDailyRateCents,
    refundCents,
  };
}

export async function getInvestorMetrics(): Promise<InvestorMetrics> {
  return getCached(CACHE_KEYS.investorMetrics, 60, getInvestorMetricsFromDb);
}
