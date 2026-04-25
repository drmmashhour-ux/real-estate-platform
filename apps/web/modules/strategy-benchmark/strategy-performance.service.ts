import type { StrategyBenchmarkDomain } from "@prisma/client";
import { prisma } from "@repo/db";

export type StrategyPerformanceView = {
  winRate: number | null;
  /** Interpreted as exposure (uses logged), not exact population size. */
  usageCount: number;
  avgClosingTime: number | null;
  confidenceLevel: "low" | "medium" | "high";
};

function confidence(usage: number): StrategyPerformanceView["confidenceLevel"] {
  if (usage < 20) return "low";
  if (usage <= 100) return "medium";
  return "high";
}

/**
 * Aggregate strategy stats — descriptive only, not a promise of future results.
 */
export async function getStrategyPerformance(
  strategyKey: string,
  domain: StrategyBenchmarkDomain
): Promise<StrategyPerformanceView> {
  try {
    const [row, usageCount] = await Promise.all([
      prisma.strategyPerformanceAggregate.findUnique({
        where: { strategyKey_domain: { strategyKey, domain } },
      }),
      prisma.strategyExecutionEvent.count({ where: { strategyKey, domain } }),
    ]);
    if (!row) {
      return { winRate: null, usageCount, avgClosingTime: null, confidenceLevel: confidence(usageCount) };
    }
    const denom = row.wins + row.losses + row.stalls;
    const winRate = denom > 0 ? row.wins / denom : null;
    return {
      winRate,
      usageCount,
      avgClosingTime: row.avgClosingTime,
      confidenceLevel: confidence(usageCount),
    };
  } catch {
    return { winRate: null, usageCount: 0, avgClosingTime: null, confidenceLevel: "low" };
  }
}

/**
 * Nudge in [-0.04, 0.04] from historical win rate vs 0.4 baseline — soft, never overwrites heuristics.
 */
export function performanceNudgeFactor(perf: StrategyPerformanceView | null): number {
  if (!perf || perf.winRate == null || perf.usageCount < 5) return 0;
  const confScale = perf.confidenceLevel === "low" ? 0.3 : perf.confidenceLevel === "medium" ? 0.6 : 1;
  const delta = (perf.winRate - 0.4) * 0.1;
  return Math.max(-0.04, Math.min(0.04, delta * confScale));
}

export type StrategyInsightRow = {
  strategyKey: string;
  domain: StrategyBenchmarkDomain;
  winRate: number | null;
  usageCount: number;
  winsCredited: number;
  lossesCredited: number;
  stallsCredited: number;
  avgClosingTime: number | null;
};

/**
 * Descriptive rollups for dashboards (probabilistic; not a leaderboard claim about any person).
 */
export async function getGlobalStrategyInsights(): Promise<{
  topPerforming: StrategyInsightRow[];
  underperforming: StrategyInsightRow[];
  mostUsed: StrategyInsightRow[];
}> {
  try {
    const rows = await prisma.strategyPerformanceAggregate.findMany({ take: 200 });
    const enriched: StrategyInsightRow[] = await Promise.all(
      rows.map(async (r) => {
        const usage = await prisma.strategyExecutionEvent.count({
          where: { strategyKey: r.strategyKey, domain: r.domain },
        });
        const denom = r.wins + r.losses + r.stalls;
        return {
          strategyKey: r.strategyKey,
          domain: r.domain,
          winRate: denom > 0 ? r.wins / denom : null,
          usageCount: usage,
          winsCredited: r.wins,
          lossesCredited: r.losses,
          stallsCredited: r.stalls,
          avgClosingTime: r.avgClosingTime,
        };
      })
    );
    const withRate = enriched.filter((x) => x.winRate != null);
    const top = [...withRate].sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0)).slice(0, 8);
    const under = [...withRate].sort((a, b) => (a.winRate ?? 0) - (b.winRate ?? 0)).slice(0, 8);
    const most = [...enriched].sort((a, b) => b.usageCount - a.usageCount).slice(0, 8);
    return { topPerforming: top, underperforming: under, mostUsed: most };
  } catch {
    return { topPerforming: [], underperforming: [], mostUsed: [] };
  }
}
