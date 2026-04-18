import type { GrowthBrainLearnInput } from "./growth-brain.types";
import { getBrainMemory, upsertBrainMemory } from "./growth-brain.memory";

const LR = 0.08;

/**
 * Online heuristic update — not ML; bounded weight nudges from real outcomes.
 */
export async function applyLearningFromOutcome(input: GrowthBrainLearnInput): Promise<void> {
  const scopeKey = `action:${input.action}`;
  const { weights, stats } = await getBrainMemory(scopeKey);
  const wSuccess = weights.successRate ?? 0.5;
  const n = stats.trials ?? 0;
  const newTrials = n + 1;
  const newSuccessRate = (wSuccess * n + (input.outcome.success ? 1 : 0)) / Math.max(1, newTrials);
  const rewardWeight = Math.max(0.05, Math.min(0.95, wSuccess + (input.outcome.success ? LR : -LR)));

  await upsertBrainMemory(scopeKey, {
    weights: { successRate: rewardWeight, lastOutcome: input.outcome.success ? 1 : 0 },
    stats: { trials: newTrials, successRate: newSuccessRate },
  });
}
