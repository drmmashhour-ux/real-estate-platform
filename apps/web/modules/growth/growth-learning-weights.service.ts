/**
 * In-memory local weights for growth orchestration scoring — reversible via reset.
 */

import {
  GROWTH_LEARNING_DECAY_FACTOR,
  GROWTH_LEARNING_MAX_TOTAL_DRIFT,
  GROWTH_LEARNING_MAX_WEIGHT_ADJUSTMENT_PER_RUN,
  GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT,
  GROWTH_LEARNING_NEUTRAL_WEIGHT,
  GROWTH_LEARNING_SMOOTHING_FACTOR,
} from "./growth-learning.constants";
import type { GrowthLearningSummary, GrowthLearningWeights } from "./growth-learning.types";

const DEFAULTS: GrowthLearningWeights = {
  impactWeight: GROWTH_LEARNING_NEUTRAL_WEIGHT,
  confidenceWeight: GROWTH_LEARNING_NEUTRAL_WEIGHT,
  signalStrengthWeight: GROWTH_LEARNING_NEUTRAL_WEIGHT,
  recencyWeight: GROWTH_LEARNING_NEUTRAL_WEIGHT,
  governancePenaltyWeight: GROWTH_LEARNING_NEUTRAL_WEIGHT,
  defaultBiasWeight: GROWTH_LEARNING_NEUTRAL_WEIGHT,
  updatedAt: new Date(0).toISOString(),
};

let memory: GrowthLearningWeights = { ...DEFAULTS, updatedAt: new Date().toISOString() };

function clampDrift(w: number): number {
  const lo = GROWTH_LEARNING_NEUTRAL_WEIGHT - GROWTH_LEARNING_MAX_TOTAL_DRIFT;
  const hi = GROWTH_LEARNING_NEUTRAL_WEIGHT + GROWTH_LEARNING_MAX_TOTAL_DRIFT;
  return Math.min(hi, Math.max(lo, w));
}

export function getGrowthCurrentWeights(): GrowthLearningWeights {
  return { ...memory };
}

export function resetGrowthLearningWeightsForTests(): void {
  memory = { ...DEFAULTS, updatedAt: new Date().toISOString() };
}

/** Pull weights slightly toward neutral before applying new deltas (bounded). */
function decayTowardNeutralStep(): void {
  const f = GROWTH_LEARNING_DECAY_FACTOR;
  const n = GROWTH_LEARNING_NEUTRAL_WEIGHT;
  memory.impactWeight = clampDrift(n + (memory.impactWeight - n) * f);
  memory.confidenceWeight = clampDrift(n + (memory.confidenceWeight - n) * f);
  memory.signalStrengthWeight = clampDrift(n + (memory.signalStrengthWeight - n) * f);
  memory.recencyWeight = clampDrift(n + (memory.recencyWeight - n) * f);
  memory.governancePenaltyWeight = clampDrift(n + (memory.governancePenaltyWeight - n) * f);
  memory.defaultBiasWeight = clampDrift(n + (memory.defaultBiasWeight - n) * f);
}

/**
 * Computes bounded deltas from evaluation summary (deterministic).
 */
export function computeGrowthWeightAdjustments(
  summary: GrowthLearningSummary,
  _current: GrowthLearningWeights,
): Partial<GrowthLearningWeights> {
  void _current;
  if (summary.warnings.some((w) => w.includes("low_evidence"))) {
    return {};
  }
  if (summary.outcomesLinked < GROWTH_LEARNING_MIN_OUTCOMES_FOR_ADJUSTMENT) {
    return {};
  }
  const max = GROWTH_LEARNING_MAX_WEIGHT_ADJUSTMENT_PER_RUN;
  const sm = GROWTH_LEARNING_SMOOTHING_FACTOR;
  const out: Partial<GrowthLearningWeights> = {};

  if (summary.positiveRate > 0.55) {
    out.impactWeight = max * sm * 0.8;
    out.confidenceWeight = max * sm * 0.6;
    out.signalStrengthWeight = max * sm * 0.4;
  }
  if (summary.negativeRate > 0.45) {
    out.governancePenaltyWeight = max * sm * 0.9;
    out.defaultBiasWeight = -max * sm * 0.7;
    out.confidenceWeight = (out.confidenceWeight ?? 0) - max * sm * 0.3;
  }
  return out;
}

/**
 * Merges deltas into in-memory weights with clamps. Returns list of applied labels.
 */
export function applyGrowthWeightAdjustments(adjustments: Partial<GrowthLearningWeights>): string[] {
  decayTowardNeutralStep();
  const applied: string[] = [];

  const bump = (key: keyof GrowthLearningWeights, delta: number | undefined) => {
    if (delta == null || typeof delta !== "number" || Number.isNaN(delta)) return;
    const prev = memory[key] as number;
    const next = clampDrift(prev + delta);
    if (Math.abs(next - prev) > 1e-9) {
      applied.push(`${String(key)}: ${prev.toFixed(4)} → ${next.toFixed(4)}`);
    }
    (memory[key] as number) = next;
  };

  bump("impactWeight", adjustments.impactWeight);
  bump("confidenceWeight", adjustments.confidenceWeight);
  bump("signalStrengthWeight", adjustments.signalStrengthWeight);
  bump("recencyWeight", adjustments.recencyWeight);
  bump("governancePenaltyWeight", adjustments.governancePenaltyWeight);
  bump("defaultBiasWeight", adjustments.defaultBiasWeight);

  memory.updatedAt = new Date().toISOString();
  return applied;
}
