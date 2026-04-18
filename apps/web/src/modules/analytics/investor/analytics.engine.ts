import { intelligenceFlags } from "@/config/feature-flags";
import { computePlatformKpis } from "./kpi.engine";
import { topCitiesByActiveListings } from "./market.analytics";
import { revenueByMonthApprox } from "./revenue.analytics";
import { computeCityLiquiditySnapshots } from "@/src/modules/liquidity/liquidity.engine";
import { prisma } from "@/lib/db";

const MS_DAY = 86_400_000;

export async function getInvestorDashboardBundle(rangeDays = 30) {
  if (!intelligenceFlags.analyticsDashboardV1) {
    return { ok: false as const, error: "feature_disabled" };
  }

  const since = new Date(Date.now() - rangeDays * MS_DAY);

  const [kpis, cities, revenue, funnel, liquidity] = await Promise.all([
    computePlatformKpis(since),
    topCitiesByActiveListings(15),
    revenueByMonthApprox(8),
    prisma.analyticsFunnelEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    computeCityLiquiditySnapshots(20),
  ]);

  return {
    ok: true as const,
    rangeDays,
    kpis,
    topCities: cities,
    revenueByMonth: revenue,
    funnel: funnel.map((f) => ({ name: f.name, count: f._count.id })),
    liquidityPreview: liquidity.slice(0, 10),
  };
}
