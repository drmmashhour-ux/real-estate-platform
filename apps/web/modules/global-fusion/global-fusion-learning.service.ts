/**
 * Fusion-local learning cycle — separate from primary advisory path; best-effort; never throws to callers.
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import type { LoadAiControlCenterParams } from "@/modules/control-center/ai-control-center.types";
import { detectGlobalFusionConflicts } from "./global-fusion-conflict.service";
import { computeGlobalFusionScores } from "./global-fusion-scoring.service";
import { normalizeControlCenterSystems } from "./global-fusion-normalizer.service";
import type { GlobalFusionLearningSnapshot, GlobalFusionLearningSummary } from "./global-fusion.types";
import {
  GF_LEARN_LOW_EVIDENCE_BLOCK_THRESHOLD,
  GF_LEARN_MAX_CONFLICT_RATIO_FOR_ADAPT,
  GF_LEARN_MIN_OUTCOMES_FOR_ADJUSTMENT,
  GF_LEARN_MIN_SIGNALS,
} from "./global-fusion-learning.constants";
import { buildLearningSignalsFromNormalized, linkOutcomesToSignals } from "./global-fusion-learning-linker.service";
import { computeSourceHitRates, evaluateLearningOutcomes } from "./global-fusion-learning-evaluator.service";
import {
  applyGlobalFusionWeightAdjustments,
  computeGlobalFusionWeightAdjustments,
} from "./global-fusion-learning-weights.service";
import {
  recordLearningCycleComplete,
  recordLearningCycleStart,
} from "./global-fusion-learning-monitoring.service";

let persistedSnapshot: GlobalFusionLearningSnapshot | null = null;

export function getPersistedLearningSnapshot(): GlobalFusionLearningSnapshot | null {
  if (!globalFusionFlags.globalFusionLearningPersistenceV1) return null;
  return persistedSnapshot;
}

function emptySummary(reason: string): GlobalFusionLearningSummary {
  return {
    runs: 0,
    signalsEvaluated: 0,
    outcomesLinked: 0,
    accuracyEstimate: null,
    recommendationHitRate: null,
    falsePositiveRate: null,
    falseNegativeRate: null,
    weightAdjustments: [],
    warnings: [],
    skipped: true,
    skipReason: reason,
  };
}

/**
 * Runs one Fusion-local learning evaluation cycle (read-only upstream reads). Safe to call on a schedule; does not block fusion payload builds.
 */
export async function runGlobalFusionLearningCycle(
  params: LoadAiControlCenterParams = {},
): Promise<GlobalFusionLearningSummary> {
  if (!globalFusionFlags.globalFusionLearningV1) {
    return emptySummary("FEATURE_GLOBAL_FUSION_LEARNING_V1_off");
  }

  try {
    recordLearningCycleStart();
    const cc = await loadAiControlCenterPayload(params);
    const freshness = cc.meta.dataFreshnessMs;
    const norm = normalizeControlCenterSystems(cc.systems, freshness);
    const conflicts = detectGlobalFusionConflicts(cc.systems, norm.signals);
    const scores = computeGlobalFusionScores(norm.signals, conflicts);

    if (norm.signals.length < GF_LEARN_MIN_SIGNALS) {
      const s = emptySummary("insufficient_signals");
      s.runs = 1;
      s.warnings.push("below_minimum_signals");
      recordLearningCycleComplete({
        summary: s,
        outcomesLinked: 0,
        insufficientLinkage: true,
        adjustmentsApplied: 0,
        adjustmentsBlocked: true,
      });
      return s;
    }

    if (scores.evidenceScore < GF_LEARN_LOW_EVIDENCE_BLOCK_THRESHOLD) {
      const s = emptySummary("low_evidence_block");
      s.runs = 1;
      s.warnings.push("evidence_below_threshold");
      recordLearningCycleComplete({
        summary: s,
        outcomesLinked: 0,
        insufficientLinkage: true,
        adjustmentsApplied: 0,
        adjustmentsBlocked: true,
      });
      return s;
    }

    const ratio = conflicts.length / Math.max(1, norm.signals.length);
    if (ratio > GF_LEARN_MAX_CONFLICT_RATIO_FOR_ADAPT) {
      const s = emptySummary("high_conflict_ratio");
      s.runs = 1;
      s.warnings.push("conflict_ratio_unsafe_for_adaptation");
      recordLearningCycleComplete({
        summary: s,
        outcomesLinked: 0,
        insufficientLinkage: true,
        adjustmentsApplied: 0,
        adjustmentsBlocked: true,
      });
      return s;
    }

    const learningSignals = buildLearningSignalsFromNormalized(norm.signals, scores);
    const outcomes = linkOutcomesToSignals(learningSignals, cc.systems);
    const linkedCount = outcomes.filter((o) => o.linkageStrength !== "unavailable").length;
    const evalResult = evaluateLearningOutcomes(outcomes);
    const sourceHits = computeSourceHitRates(evalResult.perSourceHits);
    const globalHit = evalResult.recommendationHitRate;

    const warnings: string[] = [];
    if (linkedCount < GF_LEARN_MIN_OUTCOMES_FOR_ADJUSTMENT) {
      warnings.push("low_linkage_count_for_adaptation");
    }

    let adjustments = computeGlobalFusionWeightAdjustments(sourceHits, globalHit);
    if (linkedCount < GF_LEARN_MIN_OUTCOMES_FOR_ADJUSTMENT) {
      adjustments = adjustments.map((a) => ({
        ...a,
        delta: 0,
        blocked: true,
        blockedReason: "min_outcomes",
      }));
    }

    let applied = 0;
    let blocked = true;
    if (globalFusionFlags.globalFusionLearningAdaptiveWeightsV1 && linkedCount >= GF_LEARN_MIN_OUTCOMES_FOR_ADJUSTMENT) {
      applied = applyGlobalFusionWeightAdjustments(adjustments);
      blocked = applied === 0;
    } else {
      warnings.push(globalFusionFlags.globalFusionLearningAdaptiveWeightsV1 ? "adaptive_weights_skipped" : "adaptive_weights_flag_off");
    }

    const summary: GlobalFusionLearningSummary = {
      runs: 1,
      signalsEvaluated: learningSignals.length,
      outcomesLinked: linkedCount,
      accuracyEstimate: evalResult.accuracyEstimate,
      recommendationHitRate: evalResult.recommendationHitRate,
      falsePositiveRate: evalResult.falsePositiveRate,
      falseNegativeRate: evalResult.falseNegativeRate,
      weightAdjustments: adjustments,
      warnings,
      skipped: false,
    };

    recordLearningCycleComplete({
      summary,
      outcomesLinked: linkedCount,
      insufficientLinkage: linkedCount < GF_LEARN_MIN_OUTCOMES_FOR_ADJUSTMENT,
      adjustmentsApplied: applied,
      adjustmentsBlocked: blocked,
    });

    if (globalFusionFlags.globalFusionLearningPersistenceV1) {
      persistedSnapshot = {
        generatedAt: new Date().toISOString(),
        summary,
        signals: learningSignals,
        outcomes,
      };
    }

    return summary;
  } catch (e) {
    const s = emptySummary("cycle_error");
    s.runs = 1;
    s.warnings.push(String(e));
    recordLearningCycleComplete({
      summary: s,
      outcomesLinked: 0,
      insufficientLinkage: true,
      adjustmentsApplied: 0,
      adjustmentsBlocked: true,
    });
    return s;
  }
}
