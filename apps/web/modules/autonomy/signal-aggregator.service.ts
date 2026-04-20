import { prisma } from "@/lib/db";
import { getListingRevenueMetrics, getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { addUtcDays, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import type { AutonomySignals } from "@/modules/autonomy/autonomy.types";

/**
 * Builds deterministic signal slice from BNHub bookings / snapshots (same family as revenue dashboard).
 */
export async function buildAutonomySignals(scopeType: string, scopeId: string): Promise<AutonomySignals> {
  let grossRevenue = 0;
  let occupancyRate = 0;
  let adr = 0;
  let revpar = 0;
  let bookingCount = 0;
  let revenueTrend = 0;

  if (scopeType === "portfolio") {
    const [summary, trend] = await Promise.all([
      getRevenueDashboardSummary(scopeId),
      getDailyRevenueTrend(scopeId, 14),
    ]);

    const portfolio = summary.portfolio;
    grossRevenue = portfolio.grossRevenue;
    occupancyRate = portfolio.occupancyRate;
    adr = portfolio.adr;
    revpar = portfolio.revpar;
    bookingCount = portfolio.bookingCount;

    revenueTrend =
      trend.length > 1
        ? (trend[trend.length - 1]!.revenue - trend[0]!.revenue) / (Math.abs(trend[0]!.revenue) > 1e-9 ? trend[0]!.revenue : 1)
        : 0;
  } else if (scopeType === "listing") {
    const today = startOfUtcDay(new Date());
    const start = addUtcDays(today, -29);
    const live = await getListingRevenueMetrics(scopeId, { start, end: today });
    if (!live) {
      grossRevenue = 0;
    } else {
      grossRevenue = live.grossRevenue;
      occupancyRate = live.occupancyRate;
      adr = live.adr;
      revpar = live.revpar;
      bookingCount = live.bookingCount;
    }

    const snaps = await prisma.bnhubRevenueMetricSnapshot.findMany({
      where: { scopeType: "listing", scopeId },
      orderBy: { snapshotDate: "asc" },
      take: 14,
    });
    revenueTrend =
      snaps.length > 1
        ? (snaps[snaps.length - 1]!.grossRevenue - snaps[0]!.grossRevenue) /
          (Math.abs(snaps[0]!.grossRevenue) > 1e-9 ? snaps[0]!.grossRevenue : 1)
        : 0;
  }

  const signals: AutonomySignals = {
    scopeType,
    scopeId,
    grossRevenue,
    occupancyRate,
    adr,
    revpar,
    bookingCount,
    revenueTrend,
  };

  await prisma.autonomyEventLog.create({
    data: {
      scopeType,
      scopeId,
      eventType: "signal",
      message: "Signals computed",
      meta: signals as object,
    },
  });

  return signals;
}
