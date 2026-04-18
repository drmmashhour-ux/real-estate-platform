/**
 * Aggregates linked outcomes into rates and human-readable adjustment hints.
 */

import {
  GROWTH_LEARNING_LOW_EVIDENCE_THRESHOLD,
  GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT,
} from "./growth-learning.constants";
import type { GrowthLearningOutcome, GrowthLearningSummary } from "./growth-learning.types";

export type GrowthLearningEvaluationInput = {
  outcomes: GrowthLearningOutcome[];
  /** Monotonic run counter from caller (e.g. monitoring). */
  runIndex: number;
};

/**
 * Computes summary statistics and advisory warnings. Deterministic.
 */
export function evaluateGrowthLearning(input: GrowthLearningEvaluationInput): GrowthLearningSummary {
  const { outcomes, runIndex } = input;
  const observedAt = new Date().toISOString();
  const warnings: string[] = [];
  const adjustmentsApplied: string[] = [];

  const usable = outcomes.filter((o) => o.outcomeType !== "insufficient_data");
  const insufficient = outcomes.length - usable.length;

  if (outcomes.length < GROWTH_LEARNING_LOW_EVIDENCE_THRESHOLD) {
    warnings.push("low_evidence: outcome count below threshold");
  }

  let pos = 0;
  let neg = 0;
  let neu = 0;
  for (const o of usable) {
    if (o.outcomeType === "positive") pos += 1;
    else if (o.outcomeType === "negative") neg += 1;
    else neu += 1;
  }

  const denom = usable.length || 1;
  const positiveRate = pos / denom;
  const negativeRate = neg / denom;
  const neutralRate = neu / denom;

  if (usable.length < GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT) {
    warnings.push("adjustment_blocked: insufficient non-unknown outcomes for bounded nudge");
  }

  if (positiveRate > 0.55 && usable.length >= GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT) {
    adjustmentsApplied.push("nudge: raise confidenceWeight and impactWeight slightly (positive run mix)");
  }
  if (negativeRate > 0.45 && usable.length >= GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT) {
    adjustmentsApplied.push("nudge: increase governancePenaltyWeight and reduce defaultBiasWeight slightly (risk mix)");
  }
  if (insufficient >= usable.length && outcomes.length > 0) {
    adjustmentsApplied.push("hold: mostly insufficient_data — prefer evaluate-only");
  }

  return {
    runs: runIndex,
    signalsEvaluated: outcomes.length,
    outcomesLinked: usable.length,
    positiveRate,
    negativeRate,
    neutralRate,
    adjustmentsApplied,
    warnings,
    updatedAt: observedAt,
  };
}
