import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";
import { aggregateLecipmMonetizationMetrics } from "@/modules/revenue/revenue-aggregation.service";

export type AdminRevenueIntel = {
  todayCents: number;
  sevenDayAvgCents: number;
  thirtyDayTotalCents: number;
  mrrCentsApprox: number;
  dailyAverage30dCents: number;
  series14d: Array<{ date: string; revenueCents: number }>;
  byHub: Array<{ hubKey: string; hubLabel: string; platformCents: number }>;
};

export async function getAdminRevenueIntel(): Promise<AdminRevenueIntel> {
  const [rev, agg30] = await Promise.all([
    getRevenueDashboardData(),
    aggregateLecipmMonetizationMetrics(30),
  ]);

  return {
    todayCents: rev.todayRevenueCents,
    sevenDayAvgCents: rev.sevenDayAverageCents,
    thirtyDayTotalCents: agg30.totalPlatformCents,
    mrrCentsApprox: agg30.mrrCentsApprox,
    dailyAverage30dCents: agg30.dailyAverageCents,
    series14d: rev.series.slice(-14),
    byHub: agg30.revenueByHub.map((r) => ({
      hubKey: r.hubKey,
      hubLabel: r.hubLabel,
      platformCents: r.platformCents,
    })),
  };
}
