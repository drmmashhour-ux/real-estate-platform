/**
 * Multi-market expansion signals — read-only; revenue-by-market is estimated from lead mix when metadata lacks region.
 */

import { AccountStatus, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

function startOfUtcDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addUtcDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export type MarketPerformanceRow = {
  marketKey: string;
  leads30d: number;
  /** Allocated from active broker pool × lead share (proxy). */
  brokersAllocated: number;
  revenueCad30dEstimated: number;
  performance: "high" | "mid" | "low";
};

export async function getMarketExpansionSnapshot(): Promise<{
  markets: MarketPerformanceRow[];
  globalRevenueCad30d: number;
  totalLeads30d: number;
  activeBrokersTotal: number;
  underperforming: string[];
  highPerforming: string[];
  note: string;
}> {
  const to = addUtcDays(startOfUtcDay(new Date()), 1);
  const from = addUtcDays(to, -30);

  const [leads, activeBrokersTotal, revRows] = await Promise.all([
    prisma.lead.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: { purchaseRegion: true },
      take: 40_000,
    }),
    prisma.user.count({
      where: { role: PlatformRole.BROKER, accountStatus: AccountStatus.ACTIVE },
    }),
    prisma.revenueEvent.findMany({
      where: { createdAt: { gte: from, lt: to }, amount: { gt: 0 } },
      select: { amount: true },
      take: 50_000,
    }),
  ]);

  let globalRevenueCad30d = 0;
  for (const r of revRows) {
    const a = Number(r.amount);
    if (Number.isFinite(a) && a > 0) globalRevenueCad30d += a;
  }
  globalRevenueCad30d = Math.round(globalRevenueCad30d * 100) / 100;

  const leadByMarket = new Map<string, number>();
  for (const l of leads) {
    const key = (l.purchaseRegion?.trim() || "unspecified").slice(0, 120);
    leadByMarket.set(key, (leadByMarket.get(key) ?? 0) + 1);
  }

  const totalLeads30d = leads.length;
  const denom = Math.max(1, totalLeads30d);

  const markets: MarketPerformanceRow[] = [...leadByMarket.entries()].map(([marketKey, n]) => {
    const share = n / denom;
    const revenueCad30dEstimated = Math.round(globalRevenueCad30d * share * 100) / 100;
    const brokersAllocated = Math.max(0, Math.round(activeBrokersTotal * share));

    let performance: MarketPerformanceRow["performance"] = "mid";
    if (share >= 0.12 && n >= 8) performance = "high";
    if (share < 0.03 || n < 2) performance = "low";

    return {
      marketKey,
      leads30d: n,
      brokersAllocated,
      revenueCad30dEstimated,
      performance,
    };
  });

  markets.sort((a, b) => b.revenueCad30dEstimated - a.revenueCad30dEstimated);

  const highPerforming = markets.filter((m) => m.performance === "high").map((m) => m.marketKey);
  const underperforming = markets.filter((m) => m.performance === "low").map((m) => m.marketKey);

  return {
    markets: markets.slice(0, 24),
    globalRevenueCad30d,
    totalLeads30d,
    activeBrokersTotal,
    underperforming,
    highPerforming,
    note: "Revenue-by-market is estimated (global RevenueEvent × lead share). Enrich RevenueEvent.metadata with region for exact allocation.",
  };
}
