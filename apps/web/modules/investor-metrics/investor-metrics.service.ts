import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  aggregateSnapshotInputs,
  computeLiveKpis,
  getMarketingAndGrowthInputs,
  utcDayStart,
} from "@/src/modules/investor-metrics/metricsEngine";
import type { InvestorMetricRow } from "./investor-metrics.types";

/**
 * Tabular investor metrics — each row names its DB/source lineage (auditable).
 */
export async function buildInvestorMetricTable(now: Date = new Date()): Promise<{
  generatedAt: string;
  rows: InvestorMetricRow[];
}> {
  const end = utcDayStart(now);
  const since30 = new Date(end);
  since30.setUTCDate(since30.getUTCDate() - 30);

  const [snap, kpis, marketing, gmvAgg, deals30, hosts, referrals] = await Promise.all([
    aggregateSnapshotInputs(now),
    computeLiveKpis(now),
    getMarketingAndGrowthInputs(now),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: since30, lte: now },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.deal.count({
      where: { createdAt: { gte: since30, lte: now } },
    }),
    prisma.user.count({
      where: { role: "HOST", accountStatus: "ACTIVE" },
    }),
    prisma.referral.count(),
  ]);

  const gmvCents = gmvAgg._sum.totalCents ?? 0;

  const rows: InvestorMetricRow[] = [
    { metric: "total_users", value: snap.totalUsers, timeframe: "all_time", source: "User.count" },
    { metric: "active_users_30d", value: snap.activeUsers, timeframe: "rolling_30d", source: "User.updatedAt window (see metricsEngine)" },
    { metric: "total_live_listings", value: snap.totalListings, timeframe: "point_in_time", source: "ShortTermListing PUBLISHED + FSBO ACTIVE" },
    { metric: "bookings_confirmed_completed_30d", value: snap.bookings, timeframe: "rolling_30d", source: "Booking status filter (metricsEngine)" },
    { metric: "gmv_booking_total_cents_30d", value: gmvCents, timeframe: "rolling_30d", source: "Booking.totalCents sum (confirmed/completed)" },
    { metric: "booking_count_gmv_window", value: gmvAgg._count._all, timeframe: "rolling_30d", source: "Booking rows in gmv aggregate" },
    { metric: "revenue_events_sum_30d", value: snap.revenue, timeframe: "rolling_30d", source: "RevenueEvent.amount sum (metricsEngine)" },
    { metric: "lead_win_rate_30d", value: snap.conversionRate, timeframe: "rolling_30d", source: "Lead won/(won+lost) (metricsEngine)" },
    { metric: "cac_usd_30d", value: kpis.cac, timeframe: "rolling_30d", source: "INVESTOR_MARKETING_SPEND_30D / newUsers30d" },
    { metric: "marketing_spend_30d_usd", value: marketing.marketingSpend30d, timeframe: "rolling_30d", source: "env INVESTOR_MARKETING_SPEND_30D" },
    { metric: "new_users_30d", value: marketing.newUsers30d, timeframe: "rolling_30d", source: "User.createdAt count" },
    { metric: "booking_rate_per_active", value: kpis.bookingRate, timeframe: "rolling_30d", source: "derived (metricsEngine)" },
    { metric: "revenue_per_active_user", value: kpis.revenuePerUser, timeframe: "rolling_30d", source: "derived (metricsEngine)" },
    { metric: "deals_created_30d", value: deals30, timeframe: "rolling_30d", source: "Deal.createdAt" },
    { metric: "active_hosts", value: hosts, timeframe: "point_in_time", source: "User.role HOST + ACTIVE" },
    { metric: "referral_rows_all_time", value: referrals, timeframe: "all_time", source: "Referral.count" },
  ];

  return { generatedAt: now.toISOString(), rows };
}
