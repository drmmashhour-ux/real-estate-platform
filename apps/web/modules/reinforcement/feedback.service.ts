import type { StrategyBucketOutcome } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { computeStrategyReward, type ComputeStrategyRewardInput } from "./reward.service";
import { recordReward } from "./arm-stats.service";
import { reinforcementLog } from "./reinforcement-logger";

/**
 * Closes the loop: persist reward on a decision and update arm average (never throws).
 */
export async function recordStrategyOutcomeFeedback(params: {
  decisionId?: string | null;
  dealId?: string | null;
  strategyKey?: string | null;
  domain?: import("@prisma/client").StrategyBenchmarkDomain;
  contextBucket?: string | null;
  outcome: StrategyBucketOutcome;
  closingTimeDays?: number | null;
  stageProgressionDelta?: number | null;
  objectionResolutionSignal?: number | null;
  engagementImprovementSignal?: number | null;
}): Promise<{ ok: boolean; updated: number }> {
  const reward = computeStrategyReward({
    outcome: params.outcome,
    closingTimeDays: params.closingTimeDays,
    stageProgressionDelta: params.stageProgressionDelta,
    objectionResolutionSignal: params.objectionResolutionSignal,
    engagementImprovementSignal: params.engagementImprovementSignal,
  } as ComputeStrategyRewardInput);

  try {
    if (params.decisionId) {
      const d = await prisma.reinforcementDecision.findUnique({ where: { id: params.decisionId } });
      if (d) {
        await prisma.reinforcementDecision.update({
          where: { id: d.id },
          data: { rewardObserved: reward, outcomeObserved: params.outcome },
        });
        await recordReward(d.domain, d.strategyKey, d.contextBucket, reward, params.outcome);
        reinforcementLog.feedback({ decisionId: d.id, reward, outcome: params.outcome });
        return { ok: true, updated: 1 };
      }
    }
    if (params.strategyKey && params.domain && params.contextBucket) {
      await recordReward(params.domain, params.strategyKey, params.contextBucket, reward, params.outcome);
      return { ok: true, updated: 1 };
    }
    if (params.dealId) {
      const n = await applyFeedbackToOpenDecisionsForDeal(params.dealId, params.outcome, reward);
      if (n > 0) return { ok: true, updated: n };
      const a = await tryFeedbackFromAttribution(
        params.dealId,
        params.outcome,
        reward,
        params.closingTimeDays ?? null
      );
      return a;
    }
    return { ok: true, updated: 0 };
  } catch (e) {
    reinforcementLog.warn("recordStrategyOutcomeFeedback", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, updated: 0 };
  }
}

async function applyFeedbackToOpenDecisionsForDeal(
  dealId: string,
  outcome: StrategyBucketOutcome,
  reward: number
): Promise<number> {
  const rows = await prisma.reinforcementDecision.findMany({
    where: { dealId, outcomeObserved: null },
    take: 50,
  });
  for (const d of rows) {
    await prisma.reinforcementDecision.update({
      where: { id: d.id },
      data: { rewardObserved: reward, outcomeObserved: outcome },
    });
    await recordReward(d.domain, d.strategyKey, d.contextBucket, reward, outcome);
    reinforcementLog.feedback({ decisionId: d.id, reward, outcome });
  }
  return rows.length;
}
