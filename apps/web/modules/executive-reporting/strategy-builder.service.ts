import { prisma } from "@/lib/db";
import { getReinforcementDashboardInsights } from "@/modules/reinforcement/reinforcement-insights.service";
import type { DataSourceTrace, StrategyBenchmarkRow, StrategySection } from "./executive-report.types";
import { parsePeriodKey, previousPeriodBounds } from "./period-key";

function trace(tables: string[], description: string, partialDataNote?: string): DataSourceTrace {
  return partialDataNote ? { tables, description, partialDataNote } : { tables, description };
}

function toBenchRow(r: {
  strategyKey: string;
  domain: string;
  totalUses: number;
  wins: number;
  losses: number;
  stalls: number;
  avgClosingTime: number | null;
  closingSamples: number;
}): StrategyBenchmarkRow {
  return {
    strategyKey: r.strategyKey,
    domain: r.domain,
    totalUses: r.totalUses,
    wins: r.wins,
    losses: r.losses,
    stalls: r.stalls,
    avgClosingTime: r.avgClosingTime,
    closingSamples: r.closingSamples,
  };
}

export async function buildStrategySection(periodKey: string): Promise<StrategySection> {
  const parsed = parsePeriodKey(periodKey);
  const assumptions: string[] = [
    "Strategy aggregates are observational product metrics, not causal proof of performance.",
    "Reinforcement arm rewards reflect logged bandit feedback, not external benchmarks.",
  ];

  if (!parsed) {
    return emptyStrategy(assumptions, "Invalid periodKey.");
  }

  const prev = previousPeriodBounds(parsed);

  try {
    const [topBench, weakBench, rein, curEv, prevEv, curDec, prevDec] = await Promise.all([
      prisma.strategyPerformanceAggregate.findMany({
        orderBy: [{ wins: "desc" }],
        take: 8,
      }),
      prisma.strategyPerformanceAggregate.findMany({
        where: { totalUses: { gt: 0 }, losses: { gt: 0 } },
        orderBy: [{ losses: "desc" }],
        take: 8,
      }),
      getReinforcementDashboardInsights(),
      prisma.strategyExecutionEvent.count({
        where: { createdAt: { gte: parsed.startUtc, lt: parsed.endUtcExclusive } },
      }),
      prisma.strategyExecutionEvent.count({
        where: { createdAt: { gte: prev.startUtc, lt: prev.endUtcExclusive } },
      }),
      prisma.reinforcementDecision.count({
        where: { createdAt: { gte: parsed.startUtc, lt: parsed.endUtcExclusive } },
      }),
      prisma.reinforcementDecision.count({
        where: { createdAt: { gte: prev.startUtc, lt: prev.endUtcExclusive } },
      }),
    ]);

    return {
      benchmarkTop: topBench.map(toBenchRow),
      benchmarkWeak: weakBench.map(toBenchRow),
      reinforcementTopArms: rein.topArms.slice(0, 8).map((a) => ({
        strategyKey: a.strategyKey,
        domain: a.domain,
        contextBucket: a.contextBucket,
        pulls: a.pulls,
        avgReward: a.avgReward,
      })),
      reinforcementWeakArms: rein.weakArms.slice(0, 8).map((a) => ({
        strategyKey: a.strategyKey,
        domain: a.domain,
        contextBucket: a.contextBucket,
        pulls: a.pulls,
        avgReward: a.avgReward,
      })),
      vsPreviousPeriod: {
        strategyExecutionEventsDelta: curEv - prevEv,
        reinforcementDecisionsDelta: curDec - prevDec,
        trace: trace(
          ["StrategyExecutionEvent", "ReinforcementDecision"],
          "Delta = current period count minus previous period count (same window length for weekly/monthly)."
        ),
      },
      assumptions,
    };
  } catch {
    return emptyStrategy(assumptions, "Strategy section queries failed.");
  }
}

function emptyStrategy(assumptions: string[], err: string): StrategySection {
  return {
    benchmarkTop: [],
    benchmarkWeak: [],
    reinforcementTopArms: [],
    reinforcementWeakArms: [],
    vsPreviousPeriod: {
      strategyExecutionEventsDelta: null,
      reinforcementDecisionsDelta: null,
      trace: trace([], err),
    },
    assumptions: [...assumptions, err],
  };
}
