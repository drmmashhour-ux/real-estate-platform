import { getRevenueDashboardData } from "@/modules/dashboard/services/revenue-dashboard.service";

import { getRevenuePredictorAdminSummary } from "@/modules/revenue-predictor/revenue-predictor.service";

import type { AdminSuperDashboardPayload } from "./admin-intelligence.types";
import { buildAdminAiInsights } from "./admin-ai-insights.service";
import { detectAdminAnomaliesFromRefs } from "./admin-anomaly.service";
import { getRecentAdminActivity } from "./admin-activity.service";
import { loadAdminGlobalBundle } from "./admin-summary.service";

export async function getAdminSuperDashboardPayload(): Promise<AdminSuperDashboardPayload> {
  const rev = await getRevenueDashboardData();

  const [{ global, summary, agg }, activity] = await Promise.all([
    loadAdminGlobalBundle(rev),
    getRecentAdminActivity(14),
  ]);

  const [insights, anomalies] = await Promise.all([
    Promise.resolve(buildAdminAiInsights({ rev, summary, agg })),
    detectAdminAnomaliesFromRefs(rev, summary),
  ]);

  const yesterdaySeries =
    rev.series.length >= 2 ? rev.series[rev.series.length - 2]?.revenueCents ?? 0 : 0;
  const todaySeries = rev.series.length >= 1 ? rev.series[rev.series.length - 1]?.revenueCents ?? 0 : rev.todayRevenueCents;
  let revenueGrowthPctVsPriorDay: number | null = null;
  if (yesterdaySeries > 0) {
    revenueGrowthPctVsPriorDay = Math.round(((todaySeries - yesterdaySeries) / yesterdaySeries) * 1000) / 10;
  } else if (todaySeries > 0) {
    revenueGrowthPctVsPriorDay = 100;
  }

  const hubPerformance = rev.revenueByHub.map((h) => ({
    hubKey: h.hubKey,
    hubLabel: h.hubLabel,
    revenueCents: h.amountCents,
    transactionCount: 0,
    deltaPctVsPriorDay: h.deltaPctVsPriorDay,
  }));

  return {
    generatedAt: new Date().toISOString(),
    global,
    revenueTodayCents: rev.todayRevenueCents,
    revenueSevenDayAvgCents: rev.sevenDayAverageCents,
    revenueGrowthPctVsPriorDay,
    hubPerformance,
    revenueSeries14d: rev.series,
    insights,
    anomalies,
    recentActivity: activity,
    revenuePredictor: getRevenuePredictorAdminSummary(),
  };
}
