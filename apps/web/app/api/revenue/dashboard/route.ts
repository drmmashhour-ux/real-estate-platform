import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { detectRevenueAnomalies } from "@/modules/bnhub-revenue/bnhub-revenue-anomaly.service";
import { getRevenueDashboardSummary } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getDailyRevenueTrend } from "@/modules/bnhub-revenue/bnhub-revenue-trend.service";
import { getPricingImpactSummary } from "@/modules/bnhub-revenue/bnhub-pricing-impact.service";

export const dynamic = "force-dynamic";

/** Same contract as `GET /api/bnhub/revenue/dashboard` — alias path for integrations. */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settled = await Promise.allSettled([
    getRevenueDashboardSummary(userId),
    getDailyRevenueTrend(userId, 30),
    getPricingImpactSummary(userId),
    detectRevenueAnomalies(userId),
  ]);

  const warnings: string[] = [];

  const summary =
    settled[0].status === "fulfilled"
      ? settled[0].value
      : (warnings.push("Portfolio summary unavailable"), null);

  const trend =
    settled[1].status === "fulfilled"
      ? settled[1].value
      : (warnings.push("Daily revenue trend unavailable"), []);

  const pricingImpact =
    settled[2].status === "fulfilled"
      ? settled[2].value
      : (warnings.push("Pricing impact unavailable"), {
          appliedCount: 0,
          avgDelta: 0,
          latestExecutions: [] as [],
        });

  const anomalies =
    settled[3].status === "fulfilled"
      ? settled[3].value
      : (warnings.push("Anomaly scan unavailable"), []);

  return NextResponse.json({
    success: true,
    summary,
    trend,
    pricingImpact,
    anomalies,
    warnings,
  });
}
