/**
 * Phase E observability — [global:fusion:learning]; never blocks callers.
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { GlobalFusionLearningSummary } from "./global-fusion.types";
import { getWeightDriftFromDefaultL1 } from "./global-fusion-learning-weights.service";

const NS = "[global:fusion:learning]";

type LearningMon = {
  learningRuns: number;
  outcomesLinkedTotal: number;
  insufficientLinkageRuns: number;
  adjustmentsAppliedTotal: number;
  blockedAdjustmentRuns: number;
  learningWarnings: number;
  lastSummary: GlobalFusionLearningSummary | null;
  lastRunAt: string | null;
};

let mon: LearningMon = {
  learningRuns: 0,
  outcomesLinkedTotal: 0,
  insufficientLinkageRuns: 0,
  adjustmentsAppliedTotal: 0,
  blockedAdjustmentRuns: 0,
  learningWarnings: 0,
  lastSummary: null,
  lastRunAt: null,
};

export type GlobalFusionLearningHealthSnapshot = {
  learningRuns: number;
  outcomesLinkedTotal: number;
  insufficientLinkageRate: number;
  adjustmentsAppliedTotal: number;
  blockedAdjustmentRuns: number;
  weightDriftL1: number;
  learningWarnings: number;
  lastRunAt: string | null;
};

export function recordLearningCycleStart(): void {
  try {
    mon.learningRuns++;
  } catch {
    /* noop */
  }
}

export function recordLearningCycleComplete(input: {
  summary: GlobalFusionLearningSummary;
  outcomesLinked: number;
  insufficientLinkage: boolean;
  adjustmentsApplied: number;
  adjustmentsBlocked: boolean;
}): void {
  try {
    mon.lastSummary = input.summary;
    mon.lastRunAt = new Date().toISOString();
    mon.outcomesLinkedTotal += input.outcomesLinked;
    if (input.insufficientLinkage) mon.insufficientLinkageRuns++;
    mon.adjustmentsAppliedTotal += input.adjustmentsApplied;
    if (input.adjustmentsBlocked) mon.blockedAdjustmentRuns++;
    mon.learningWarnings += input.summary.warnings.length;
    logInfo(NS, {
      event: "cycle_complete",
      skipped: input.summary.skipped,
      signals: input.summary.signalsEvaluated,
      outcomes: input.summary.outcomesLinked,
      hitRate: input.summary.recommendationHitRate,
      adjustments: input.summary.weightAdjustments.filter((a) => !a.blocked && a.delta !== 0).length,
      warnings: input.summary.warnings.length,
      driftL1: getWeightDriftFromDefaultL1(),
    });
    for (const w of input.summary.warnings.slice(0, 5)) {
      logWarn(NS, { event: "learning_observation", warning: w });
    }
    if (input.summary.warnings.some((x) => x.includes("coverage"))) {
      logWarn(NS, { event: "threshold", kind: "low_outcome_coverage" });
    }
    if (getWeightDriftFromDefaultL1() > 0.1) {
      logWarn(NS, { event: "threshold", kind: "weight_drift_elevated", driftL1: getWeightDriftFromDefaultL1() });
    }
  } catch {
    /* noop */
  }
}

export function getGlobalFusionLearningHealthSnapshot(): GlobalFusionLearningHealthSnapshot {
  const runs = Math.max(1, mon.learningRuns);
  return {
    learningRuns: mon.learningRuns,
    outcomesLinkedTotal: mon.outcomesLinkedTotal,
    insufficientLinkageRate: Math.min(1, mon.insufficientLinkageRuns / runs),
    adjustmentsAppliedTotal: mon.adjustmentsAppliedTotal,
    blockedAdjustmentRuns: mon.blockedAdjustmentRuns,
    weightDriftL1: getWeightDriftFromDefaultL1(),
    learningWarnings: mon.learningWarnings,
    lastRunAt: mon.lastRunAt,
  };
}

export function getLastLearningSummary(): GlobalFusionLearningSummary | null {
  return mon.lastSummary;
}

export function resetGlobalFusionLearningMonitoringForTests(): void {
  mon = {
    learningRuns: 0,
    outcomesLinkedTotal: 0,
    insufficientLinkageRuns: 0,
    adjustmentsAppliedTotal: 0,
    blockedAdjustmentRuns: 0,
    learningWarnings: 0,
    lastSummary: null,
    lastRunAt: null,
  };
}
