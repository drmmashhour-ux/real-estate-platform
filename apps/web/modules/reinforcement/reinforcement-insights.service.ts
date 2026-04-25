import type { StrategyBenchmarkDomain } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Read-only rollups for dashboards; never used for auto-exec.
 */
export async function getReinforcementDashboardInsights(): Promise<{
  policies: { id: string; domain: string; policyType: string; explorationRate: number; isActive: boolean }[];
  topArms: {
    strategyKey: string;
    domain: string;
    contextBucket: string;
    pulls: number;
    avgReward: number | null;
    wins: number;
    losses: number;
    stalls: number;
  }[];
  /** Lower avg reward in bucket (low data: interpret cautiously). */
  weakArms: {
    strategyKey: string;
    domain: string;
    contextBucket: string;
    pulls: number;
    avgReward: number | null;
    wins: number;
    losses: number;
    stalls: number;
  }[];
  recentDecisions: {
    id: string;
    domain: string;
    strategyKey: string;
    selectionMode: string;
    contextBucket: string;
    createdAt: string;
  }[];
  exploreCount: number;
  exploitCount: number;
}> {
  try {
    const [policies, arms, weak, recent, ex, ey] = await Promise.all([
      prisma.reinforcementPolicy.findMany({ where: { isActive: true }, take: 20, orderBy: { domain: "asc" } }),
      prisma.reinforcementArmStat.findMany({
        orderBy: [{ avgReward: "desc" }],
        take: 30,
        where: { pulls: { gt: 0 } },
      }),
      prisma.reinforcementArmStat.findMany({
        orderBy: [{ avgReward: "asc" }],
        take: 15,
        where: { pulls: { gt: 0 } },
      }),
      prisma.reinforcementDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, domain: true, strategyKey: true, selectionMode: true, contextBucket: true, createdAt: true },
      }),
      prisma.reinforcementDecision.count({ where: { selectionMode: "explore" } }),
      prisma.reinforcementDecision.count({ where: { selectionMode: "exploit" } }),
    ]);
    return {
      policies: policies.map((p) => ({
        id: p.id,
        domain: p.domain,
        policyType: p.policyType,
        explorationRate: p.explorationRate,
        isActive: p.isActive,
      })),
      topArms: arms.map((a) => ({
        strategyKey: a.strategyKey,
        domain: a.domain,
        contextBucket: a.contextBucket,
        pulls: a.pulls,
        avgReward: a.avgReward,
        wins: a.wins,
        losses: a.losses,
        stalls: a.stalls,
      })),
      weakArms: weak.map((a) => ({
        strategyKey: a.strategyKey,
        domain: a.domain,
        contextBucket: a.contextBucket,
        pulls: a.pulls,
        avgReward: a.avgReward,
        wins: a.wins,
        losses: a.losses,
        stalls: a.stalls,
      })),
      recentDecisions: recent.map((d) => ({
        id: d.id,
        domain: d.domain,
        strategyKey: d.strategyKey,
        selectionMode: d.selectionMode,
        contextBucket: d.contextBucket,
        createdAt: d.createdAt.toISOString(),
      })),
      exploreCount: ex,
      exploitCount: ey,
    };
  } catch {
    return {
      policies: [],
      topArms: [],
      weakArms: [],
      recentDecisions: [],
      exploreCount: 0,
      exploitCount: 0,
    };
  }
}

export async function getArmsByBucket(
  domain: StrategyBenchmarkDomain,
  contextBucket: string
): Promise<
  { strategyKey: string; avgReward: number | null; pulls: number; wins: number; losses: number; stalls: number }[]
> {
  try {
    return await prisma.reinforcementArmStat.findMany({
      where: { domain, contextBucket },
      orderBy: { avgReward: "desc" },
      take: 30,
    });
  } catch {
    return [];
  }
}
