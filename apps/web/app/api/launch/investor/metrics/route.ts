import { NextResponse } from "next/server";
import { lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildInvestorMetricTable } from "@/modules/investor-metrics/investor-metrics.service";
import { buildMarketplaceMetricsSnapshot } from "@/modules/investor-metrics/marketplace-metrics.service";
import { buildRevenueMetricsSnapshot } from "@/modules/investor-metrics/revenue-metrics.service";
import { buildUnitEconomicsSnapshot } from "@/modules/investor-metrics/unit-economics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!lecipmLaunchInvestorFlags.investorMetricsV1) {
    return NextResponse.json({ error: "Investor metrics module disabled" }, { status: 403 });
  }

  const now = new Date();
  const [table, marketplace, revenue, unit] = await Promise.all([
    buildInvestorMetricTable(now),
    buildMarketplaceMetricsSnapshot(now),
    buildRevenueMetricsSnapshot(now),
    buildUnitEconomicsSnapshot(now),
  ]);

  return NextResponse.json({
    metricTable: table,
    marketplace,
    revenue,
    unitEconomics: unit,
  });
}
