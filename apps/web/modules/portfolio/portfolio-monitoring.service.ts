import { prisma } from "@/lib/db";
import { portfolioLog } from "./portfolio-log";
import type { PlatformRole } from "@prisma/client";
import { listAccessibleAssetIds } from "./portfolio-access";

export async function getPortfolioMonitoringSummary(userId: string, role: PlatformRole) {
  const assetIds = await listAccessibleAssetIds(userId, role);
  portfolioLog.monitoring("summary", { userId, assets: assetIds.length });

  const healthRows = await prisma.portfolioAssetHealth.findMany({
    where: { assetId: { in: assetIds } },
  });

  const bands = { STRONG: 0, STABLE: 0, WATCHLIST: 0, AT_RISK: 0, CRITICAL: 0, UNKNOWN: 0 };
  for (const h of healthRows) {
    const b = h.healthBand;
    if (b && b in bands) bands[b as keyof Omit<typeof bands, "UNKNOWN">]++;
    else bands.UNKNOWN++;
  }

  const plans = await prisma.assetManagerPlan.groupBy({
    by: ["strategyType"],
    where: { assetId: { in: assetIds } },
    _count: true,
  });

  const criticalActions = await prisma.assetManagerAction.count({
    where: {
      assetId: { in: assetIds },
      priority: "CRITICAL",
      status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
    },
  });

  const decisions = await prisma.lecipmPortfolioOptimizationRun.count({
    where: { ownerId: userId },
  });

  return {
    assetScope: assetIds.length,
    healthBands: bands,
    strategies: plans.map((p) => ({ strategyType: p.strategyType ?? "UNKNOWN", count: p._count })),
    openCriticalActions: criticalActions,
    optimizationRunsLogged: decisions,
    recurringBlockers: bands.CRITICAL + bands.AT_RISK > 2 ? ["multi-asset tail risk concentration"] : [],
    disclosure: "Internal diagnostics — not investor-grade reporting without report service outputs.",
  };
}
