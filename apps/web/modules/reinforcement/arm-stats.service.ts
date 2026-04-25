import type { StrategyBenchmarkDomain } from "@prisma/client";
import { prisma } from "@repo/db";
import { reinforcementLog } from "./reinforcement-logger";

/**
 * Get arm state for a (strategy, domain, bucket) — null if never pulled.
 */
export async function getArmStat(
  domain: StrategyBenchmarkDomain,
  strategyKey: string,
  contextBucket: string
): Promise<{
  pulls: number;
  rewardsSum: number;
  avgReward: number | null;
  wins: number;
  losses: number;
  stalls: number;
} | null> {
  try {
    const r = await prisma.reinforcementArmStat.findUnique({
      where: { strategyKey_domain_contextBucket: { strategyKey, domain, contextBucket } },
    });
    if (!r) return null;
    return {
      pulls: r.pulls,
      rewardsSum: r.rewardsSum,
      avgReward: r.avgReward,
      wins: r.wins,
      losses: r.losses,
      stalls: r.stalls,
    };
  } catch {
    return null;
  }
}

export async function sumBucketPulls(domain: StrategyBenchmarkDomain, contextBucket: string): Promise<number> {
  try {
    const agg = await prisma.reinforcementArmStat.aggregate({
      where: { domain, contextBucket },
      _sum: { pulls: true },
    });
    return agg._sum.pulls ?? 0;
  } catch {
    return 0;
  }
}

/**
 * After a selection is logged as a decision — increments pulls (one draw).
 */
export async function recordSelection(
  domain: StrategyBenchmarkDomain,
  strategyKey: string,
  contextBucket: string
): Promise<void> {
  try {
    await prisma.reinforcementArmStat.upsert({
      where: { strategyKey_domain_contextBucket: { strategyKey, domain, contextBucket } },
      create: {
        strategyKey,
        domain,
        contextBucket,
        pulls: 1,
        rewardsSum: 0,
        avgReward: null,
        wins: 0,
        losses: 0,
        stalls: 0,
      },
      update: { pulls: { increment: 1 } },
    });
    reinforcementLog.arm({ strategyKey, domain, contextBucket, event: "pull" });
  } catch (e) {
    reinforcementLog.warn("recordSelection", { err: e instanceof Error ? e.message : String(e) });
  }
}

/**
 * Record observed reward and outcome — updates running averages and outcome tallies.
 */
export async function recordReward(
  domain: StrategyBenchmarkDomain,
  strategyKey: string,
  contextBucket: string,
  reward: number,
  outcome: "WON" | "LOST" | "STALLED"
): Promise<void> {
  try {
    const wD = outcome === "WON" ? 1 : 0;
    const lD = outcome === "LOST" ? 1 : 0;
    const sD = outcome === "STALLED" ? 1 : 0;
    await prisma.reinforcementArmStat.upsert({
      where: { strategyKey_domain_contextBucket: { strategyKey, domain, contextBucket } },
      create: {
        strategyKey,
        domain,
        contextBucket,
        pulls: 0,
        rewardsSum: reward,
        wins: wD,
        losses: lD,
        stalls: sD,
        avgReward: reward,
      },
      update: {
        rewardsSum: { increment: reward },
        wins: { increment: wD },
        losses: { increment: lD },
        stalls: { increment: sD },
      },
    });
    const u = await prisma.reinforcementArmStat.findUnique({
      where: { strategyKey_domain_contextBucket: { strategyKey, domain, contextBucket } },
    });
    if (u) {
      const n = u.wins + u.losses + u.stalls;
      const ar = n > 0 ? u.rewardsSum / n : null;
      await prisma.reinforcementArmStat.update({
        where: { strategyKey_domain_contextBucket: { strategyKey, domain, contextBucket } },
        data: { avgReward: ar },
      });
    }
    reinforcementLog.arm({ strategyKey, domain, contextBucket, reward, outcome });
  } catch (e) {
    reinforcementLog.warn("recordReward", { err: e instanceof Error ? e.message : String(e) });
  }
}
