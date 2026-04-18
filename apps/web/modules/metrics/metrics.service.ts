import { prisma } from "@/lib/db";
import { computeCityLiquiditySnapshots } from "@/src/modules/liquidity/liquidity.engine";
import {
  countActiveListingsSnapshot,
  countNewListingsInRange,
  countNewUsers,
  countReturningUsersProxy,
  getEngagementCounts,
  getEventLogConversionRollup,
  getPlatformRevenueBreakdown,
} from "./aggregation.service";
import type { CoreMetricsBundle, MetricsSegment } from "./metrics.types";
import { daysBetween, previousPeriod } from "./timeseries.service";
import { startOfUtcDay } from "@/modules/analytics/services/get-platform-stats";

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export type MetricsRequest = {
  from: Date;
  toExclusive: Date;
  segment?: MetricsSegment;
};

/**
 * Core Command Center metrics — internal aggregates; CTR and funnel rates depend on consistent `EventLog` instrumentation.
 */
export async function getCoreMetricsBundle(input: MetricsRequest): Promise<CoreMetricsBundle> {
  const { from, toExclusive } = input;
  const segment = input.segment ?? {};
  const dataQualityNotes: string[] = [
    "CTR and funnel rates use `event_logs` listing_* types; sparse logging yields low denominators.",
    "Returning users = distinct users with events in range who signed up before the window.",
    "Session rollup = sum of `platform_analytics.visitors` per UTC day in range (not unique sessions).",
    "Anomaly rules compare this window to the prior equal-length window — pick consistent ranges when auditing.",
  ];

  const [
    totalUsers,
    newUsersInRange,
    returningUsers,
    platformRows,
    activeSnap,
    newListings,
    engagement,
    conversionRollup,
    revenue,
    liquidity,
  ] = await Promise.all([
    prisma.user.count(),
    countNewUsers(from, toExclusive),
    countReturningUsersProxy(from, toExclusive),
    prisma.platformAnalytics.findMany({
      where: { date: { gte: startOfUtcDay(from), lt: toExclusive } },
      select: { visitors: true },
    }),
    countActiveListingsSnapshot(segment),
    countNewListingsInRange(from, toExclusive, segment),
    getEngagementCounts(from),
    getEventLogConversionRollup(from),
    getPlatformRevenueBreakdown(from, toExclusive),
    computeCityLiquiditySnapshots(12),
  ]);

  const sessionDaysRollup = platformRows.reduce((s, r) => s + r.visitors, 0);

  const prev = previousPeriod(from, toExclusive);
  const newListingsPrev = await countNewListingsInRange(prev.from, prev.toExclusive, segment);
  const listingGrowthRate =
    newListingsPrev > 0 ? (newListings - newListingsPrev) / newListingsPrev : newListings > 0 ? 1 : null;

  const imp = engagement.listingImpressions;
  const clk = engagement.listingClicks;
  const ctr = imp > 0 ? clk / imp : 0;

  const rates = conversionRollup.rates;
  const visitToClickRate = imp > 0 ? clk / imp : null;
  const clickToInquiryRate = clk > 0 ? rates.inquiryRate : null;
  const inq = conversionRollup.counts.inquiry_submit ?? 0;
  const inquiryToBookingRate = inq > 0 ? (conversionRollup.counts.booking_complete ?? 0) / inq : null;

  const topAreas = liquidity.map((L) => ({
    city: L.city,
    activeListings: L.supply.activeListings,
    views7d: L.demand.views7d,
    saves7d: L.demand.saves7d,
    ratio: L.liquidityScore,
    ratioNote: `Liquidity ${L.liquidityScore.toFixed(0)} — ${L.interpretation} (internal 7d window).`,
  }));

  return {
    range: { from: from.toISOString(), toExclusive: toExclusive.toISOString() },
    segment,
    traffic: {
      totalUsers,
      newUsersInRange,
      returningUsersEstimate: returningUsers,
      returningUsersNote: "Distinct accounts with `event_logs` activity and account created before range.",
      sessionDaysRollup,
      sessionDaysNote: "Sum of daily visitor counts from `platform_analytics` (not deduped across days).",
    },
    marketplace: {
      activeListingsTotal: activeSnap.fsbo + activeSnap.bnhub + activeSnap.crm,
      activeFsbo: activeSnap.fsbo,
      activeBnhubStays: activeSnap.bnhub,
      activeCrmListings: activeSnap.crm,
      newListingsInRange: newListings,
      listingGrowthRate,
      listingGrowthNote: "Versus prior period of equal length (new FSBO+BNHub+CRM listings, subject to segment).",
    },
    engagement: {
      listingImpressions: imp,
      listingClicks: clk,
      listingSaves: engagement.listingSaves,
      shares: engagement.shares,
      ctr,
      ctrNote: "listing_click / listing_impression in range.",
    },
    conversion: {
      inquiries: inq,
      bookingStarts: conversionRollup.counts.booking_start ?? 0,
      bookingsCompleted: conversionRollup.counts.booking_complete ?? 0,
      visitToClickRate,
      clickToInquiryRate,
      inquiryToBookingRate,
      conversionNote: "Rates from `getEventLogConversionRollup` definitions (see conversion-metrics.service.ts).",
    },
    supplyDemand: {
      topAreas,
      supplyDemandNote: "City rows from liquidity engine (FSBO views/saves + active listings, 7d demand slice).",
    },
    revenue: {
      platformFeesCents: revenue.platformFeesCents,
      featuredRevenueCents: revenue.featuredRevenueCents,
      subscriptionRevenueCents: revenue.subscriptionRevenueCents,
      bnhubCommissionCents: revenue.bnhubCommissionCents,
      totalRevenueCents: revenue.totalRevenueCents,
      revenueNote: "From `platform_revenue_events` realized in range; types mapped in aggregation.service.",
    },
    dataQualityNotes,
  };
}

/** Helpers for presets */
export function rangeFromDays(days: number): { from: Date; toExclusive: Date } {
  const d = Math.min(366, Math.max(1, Math.floor(days)));
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const from = addUtcDays(todayStart, -(d - 1));
  const toExclusive = addUtcDays(todayStart, 1);
  return { from, toExclusive };
}

export { daysBetween };
