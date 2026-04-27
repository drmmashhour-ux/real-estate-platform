import { isDemoMode } from "@/lib/demo/isDemoMode";
import { investorPlatformDemoMetrics } from "@/lib/demo/demoData";
import { query } from "@/lib/sql";
import { getPlatformMetrics, type PlatformMetrics } from "./metrics";
import { getGrowthRecommendations, type GrowthRecommendationsResult } from "./growthEngine";

type SumRow = { n: string };

export type InvestorDashboardData = PlatformMetrics & {
  revenue: number;
  growth: GrowthRecommendationsResult;
  /** `ListingOptimization` row count. */
  aiImpact: number;
  /** `ai_execution_logs` row count (proxy for applied autonomy / impact surface). */
  aiRevenueLift: number;
};

/**
 * One-shot platform KPIs + growth funnel + revenue + AI surface counts for internal / admin investor views.
 * Safe in `DEMO_MODE=1` (no SQL) — returns {@link investorPlatformDemoMetrics} shape.
 */
export async function getInvestorDashboard(): Promise<InvestorDashboardData> {
  if (isDemoMode) {
    return { ...investorPlatformDemoMetrics };
  }

  const metrics = await getPlatformMetrics();
  const growth = await getGrowthRecommendations();

  const [revenueRows, optRows, execRows] = await Promise.all([
    query<SumRow>(
      `SELECT COALESCE(SUM("totalCents"), 0)::text AS n FROM "Booking"`,
    ),
    query<SumRow>(`SELECT COUNT(*)::text AS n FROM "ListingOptimization"`),
    query<SumRow>(`SELECT COUNT(*)::text AS n FROM "ai_execution_logs"`),
  ]);

  const revenueCents = Number(revenueRows[0]?.n ?? 0) || 0;
  return {
    ...metrics,
    revenue: revenueCents / 100,
    growth,
    aiImpact: Number(optRows[0]?.n ?? 0) || 0,
    aiRevenueLift: Number(execRows[0]?.n ?? 0) || 0,
  };
}
