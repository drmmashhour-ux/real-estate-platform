/**
 * Growth learning observability — gated by FEATURE_GROWTH_LEARNING_MONITORING_V1; never throws.
 */

import { growthLearningFlags } from "@/config/feature-flags";
import type { GrowthLearningWeights } from "./growth-learning.types";

export type GrowthLearningMonitoringSnapshot = {
  learningRuns: number;
  outcomesLinked: number;
  insufficientDataCount: number;
  adjustmentsComputed: number;
  adjustmentsApplied: number;
  blockedAdjustmentCount: number;
  currentWeightDrift: number;
  warningsCount: number;
};

const snap: GrowthLearningMonitoringSnapshot = {
  learningRuns: 0,
  outcomesLinked: 0,
  insufficientDataCount: 0,
  adjustmentsComputed: 0,
  adjustmentsApplied: 0,
  blockedAdjustmentCount: 0,
  currentWeightDrift: 0,
  warningsCount: 0,
};

export function getGrowthLearningMonitoringSnapshot(): GrowthLearningMonitoringSnapshot {
  return { ...snap };
}

export function resetGrowthLearningMonitoringForTests(): void {
  snap.learningRuns = 0;
  snap.outcomesLinked = 0;
  snap.insufficientDataCount = 0;
  snap.adjustmentsComputed = 0;
  snap.adjustmentsApplied = 0;
  snap.blockedAdjustmentCount = 0;
  snap.currentWeightDrift = 0;
  snap.warningsCount = 0;
}

function maxDriftFromNeutral(w: GrowthLearningWeights): number {
  const vals = [
    w.impactWeight,
    w.confidenceWeight,
    w.signalStrengthWeight,
    w.recencyWeight,
    w.governancePenaltyWeight,
    w.defaultBiasWeight,
  ];
  let m = 0;
  for (const v of vals) {
    m = Math.max(m, Math.abs(v - 1));
  }
  return m;
}

export function logGrowthLearningPhase(phase: "started" | "completed", extra?: Record<string, unknown>): void {
  if (!growthLearningFlags.growthLearningMonitoringV1) return;
  try {
    console.log(JSON.stringify({ tag: "[growth:learning]", phase, ...extra }));
  } catch {
    /* never throw */
  }
}

export function recordGrowthLearningRun(input: {
  outcomesLinked: number;
  insufficientDataCount: number;
  adjustmentsComputed: number;
  adjustmentsApplied: number;
  blockedAdjustmentCount: number;
  weights: GrowthLearningWeights;
  warningsCount: number;
}): void {
  if (!growthLearningFlags.growthLearningMonitoringV1) {
    return;
  }
  try {
    snap.learningRuns += 1;
    snap.outcomesLinked += input.outcomesLinked;
    snap.insufficientDataCount += input.insufficientDataCount;
    snap.adjustmentsComputed += input.adjustmentsComputed;
    snap.adjustmentsApplied += input.adjustmentsApplied;
    snap.blockedAdjustmentCount += input.blockedAdjustmentCount;
    snap.warningsCount += input.warningsCount;
    snap.currentWeightDrift = maxDriftFromNeutral(input.weights);

    console.log(
      JSON.stringify({
        tag: "[growth:learning]",
        phase: "completed",
        outcomesLinked: input.outcomesLinked,
        insufficientDataCount: input.insufficientDataCount,
        adjustmentsComputed: input.adjustmentsComputed,
        adjustmentsApplied: input.adjustmentsApplied,
        blockedAdjustmentCount: input.blockedAdjustmentCount,
        weightDrift: snap.currentWeightDrift,
        weightSnapshot: {
          impactWeight: input.weights.impactWeight,
          confidenceWeight: input.weights.confidenceWeight,
          signalStrengthWeight: input.weights.signalStrengthWeight,
          recencyWeight: input.weights.recencyWeight,
          governancePenaltyWeight: input.weights.governancePenaltyWeight,
          defaultBiasWeight: input.weights.defaultBiasWeight,
        },
        warningsCount: input.warningsCount,
      }),
    );
  } catch {
    /* never throw */
  }
}
