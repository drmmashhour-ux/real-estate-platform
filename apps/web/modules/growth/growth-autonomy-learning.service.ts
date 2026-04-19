/**
 * Learning loop orchestration — deterministic bounded adjustments; never bypasses policy or rollout.
 */

import { growthAutonomyFlags } from "@/config/feature-flags";
import { GROWTH_AUTONOMY_CATALOG } from "./growth-autonomy-catalog";
import { computeEffectivenessForCategory } from "./growth-autonomy-effectiveness.service";
import { getGrowthAutonomyLearningGuardrails } from "./growth-autonomy-learning-config";
import { catalogIdToLearningCategory } from "./growth-autonomy-learning-category";
import { explainLearningDecision } from "./growth-autonomy-learning-explainer.service";
import {
  appendGrowthAutonomyLearningRecord,
  bumpCategoryAggregate,
  getGrowthAutonomyLearningStateRow,
  upsertGrowthAutonomyLearningState,
} from "./growth-autonomy-learning.repository";
import type {
  GrowthAutonomyCategoryAggregate,
  GrowthAutonomyLearningDecision,
  GrowthAutonomyLearningSnapshot,
  GrowthAutonomyRecommendationCategory,
} from "./growth-autonomy-learning.types";
import {
  recordLearningCycle,
  recordLearningDisabledSkip,
  recordLearningRecordCreated,
} from "./growth-autonomy-learning-monitoring.service";

const CYCLE_THROTTLE_MS = 45_000;
/** First cycle always eligible; avoids epoch/fake-timer edge where `now - 0 < throttle`. */
let lastCycleAt = Number.NEGATIVE_INFINITY;

function emptyAgg(): GrowthAutonomyCategoryAggregate {
  return {
    shown: 0,
    interacted: 0,
    prefillUsed: 0,
    completed: 0,
    helpfulYes: 0,
    helpfulNo: 0,
    confusion: 0,
    ignored: 0,
  };
}

function clampDeltaAbsolute(delta: number): number {
  const g = getGrowthAutonomyLearningGuardrails();
  return Math.min(g.maxPriorityIncrease, Math.max(-g.maxPriorityDecrease, delta));
}

export type GrowthAutonomyLearningOrchestrationContext = {
  adaptiveInfluenceAllowed: boolean;
  weightDeltasByCategory: Record<string, number>;
  suppressedUntilByCategory: Record<string, number>;
};

export async function loadGrowthAutonomyLearningOrchestrationContext(args: {
  killSwitchActive: boolean;
}): Promise<GrowthAutonomyLearningOrchestrationContext> {
  if (!growthAutonomyFlags.growthAutonomyLearningV1 || args.killSwitchActive) {
    recordLearningDisabledSkip();
    return {
      adaptiveInfluenceAllowed: false,
      weightDeltasByCategory: {},
      suppressedUntilByCategory: {},
    };
  }
  const row = await getGrowthAutonomyLearningStateRow();
  if (row.controlFlags.frozen) {
    return {
      adaptiveInfluenceAllowed: false,
      weightDeltasByCategory: row.weightDeltasByCategory,
      suppressedUntilByCategory: row.suppressedUntilByCategory,
    };
  }
  return {
    adaptiveInfluenceAllowed: true,
    weightDeltasByCategory: row.weightDeltasByCategory,
    suppressedUntilByCategory: row.suppressedUntilByCategory,
  };
}

export async function runGrowthAutonomyLearningCycle(): Promise<void> {
  if (!growthAutonomyFlags.growthAutonomyLearningV1) return;
  const now = Date.now();
  if (now - lastCycleAt < CYCLE_THROTTLE_MS) return;
  lastCycleAt = now;

  const row = await getGrowthAutonomyLearningStateRow();
  if (row.controlFlags.frozen) return;

  const g = getGrowthAutonomyLearningGuardrails();
  const weights = { ...row.weightDeltasByCategory };
  const suppressed = { ...row.suppressedUntilByCategory };
  let adjusted = 0;
  let suppressedCount = 0;
  let sparse = 0;

  for (const entry of GROWTH_AUTONOMY_CATALOG) {
    const id = entry.id;
    const cat = catalogIdToLearningCategory(id);
    const agg = row.aggregatesByCategory[id] ?? emptyAgg();
    const eff = computeEffectivenessForCategory({ category: cat, aggregate: agg });

    if (eff.band === "insufficient_data") {
      sparse += 1;
      continue;
    }

    let prev = weights[id] ?? 0;
    const ignoredRate = agg.ignored / Math.max(1, agg.shown);
    const feedbackDenom = agg.helpfulYes + agg.helpfulNo;
    const negFbRate = feedbackDenom > 0 ? agg.helpfulNo / feedbackDenom : 0;

    if (
      eff.band === "poor" &&
      ignoredRate >= g.suppressionThresholdIgnoredRate &&
      agg.shown >= g.minObservationsBeforeLearning
    ) {
      suppressed[id] = now + g.reevaluationCooldownMs;
      prev = clampDeltaAbsolute(prev - g.stepDecrease);
      adjusted += 1;
      suppressedCount += 1;
    } else if (negFbRate >= g.negativeFeedbackSuppressionRate && feedbackDenom >= 6) {
      prev = clampDeltaAbsolute(prev - g.stepDecrease);
      adjusted += 1;
    } else if (
      (eff.band === "strong" || eff.band === "good") &&
      (agg.interacted + agg.prefillUsed) / Math.max(1, agg.shown) > 0.18 &&
      agg.completed / Math.max(1, agg.shown) > 0.04
    ) {
      prev = clampDeltaAbsolute(prev + g.stepIncrease);
      adjusted += 1;
    } else if (eff.band === "weak" || eff.band === "poor") {
      prev = clampDeltaAbsolute(prev - g.stepDecrease * 0.5);
      adjusted += 1;
    }

    weights[id] = prev;
  }

  await upsertGrowthAutonomyLearningState({
    weightDeltasByCategory: weights,
    suppressedUntilByCategory: suppressed,
    aggregatesByCategory: row.aggregatesByCategory,
    controlFlags: row.controlFlags,
    lastLearningRunAt: new Date(),
  });

  recordLearningCycle({ adjusted, suppressed: suppressedCount, sparse });
}

export async function recordGrowthAutonomyLearningEvent(args: {
  suggestionId: string;
  categoryId: string;
  targetKey: string;
  operatorUserId: string | null;
  kind:
    | "shown"
    | "interaction"
    | "prefill_used"
    | "completed"
    | "ignored"
    | "feedback_helpful"
    | "feedback_not_helpful"
    | "confusion";
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (!growthAutonomyFlags.growthAutonomyLearningV1) {
    recordLearningDisabledSkip();
    return;
  }

  await appendGrowthAutonomyLearningRecord({
    suggestionId: args.suggestionId,
    categoryId: args.categoryId,
    targetKey: args.targetKey,
    operatorUserId: args.operatorUserId,
    interactionKind: args.kind,
    payload: args.payload ?? {},
  });
  recordLearningRecordCreated();

  const bump: Partial<GrowthAutonomyCategoryAggregate> = {};
  switch (args.kind) {
    case "shown":
      bump.shown = 1;
      break;
    case "interaction":
      bump.interacted = 1;
      break;
    case "prefill_used":
      bump.prefillUsed = 1;
      break;
    case "completed":
      bump.completed = 1;
      break;
    case "ignored":
      bump.ignored = 1;
      break;
    case "feedback_helpful":
      bump.helpfulYes = 1;
      break;
    case "feedback_not_helpful":
      bump.helpfulNo = 1;
      break;
    case "confusion":
      bump.confusion = 1;
      break;
    default:
      break;
  }

  await bumpCategoryAggregate(args.categoryId, bump);
  await runGrowthAutonomyLearningCycle();
}

/** Snapshot block embedded in autonomy API — explainable summary for operators. */
export async function buildGrowthAutonomyLearningSnapshotForEmbed(args: {
  killSwitchActive: boolean;
}): Promise<GrowthAutonomyLearningSnapshot | undefined> {
  if (!growthAutonomyFlags.growthAutonomyLearningV1) return undefined;

  const row = await getGrowthAutonomyLearningStateRow();
  const adaptive =
    growthAutonomyFlags.growthAutonomyLearningV1 &&
    !args.killSwitchActive &&
    !row.controlFlags.frozen;

  const effectiveness: GrowthAutonomyLearningSnapshot["effectiveness"] = {};
  const explanations: GrowthAutonomyLearningSnapshot["explanations"] = {};
  const decisions: GrowthAutonomyLearningSnapshot["decisions"] = {};

  let categoriesAdjusted = 0;
  let categoriesSuppressed = 0;
  let sparseDataCategories = 0;
  const now = Date.now();

  for (const entry of GROWTH_AUTONOMY_CATALOG) {
    const id = entry.id;
    const cat = catalogIdToLearningCategory(id);
    const agg = row.aggregatesByCategory[id] ?? emptyAgg();
    const eff = computeEffectivenessForCategory({ category: cat, aggregate: agg });
    effectiveness[cat] = eff;
    if (eff.band === "insufficient_data") sparseDataCategories += 1;

    const delta = row.weightDeltasByCategory[id] ?? 0;
    const until = row.suppressedUntilByCategory[id] ?? 0;
    if (until > now) categoriesSuppressed += 1;
    if (delta !== 0) categoriesAdjusted += 1;

    let decision: GrowthAutonomyLearningDecision = "neutral";
    if (until > now && eff.band !== "insufficient_data") decision = "suppress_temporarily";
    else if (delta > 0.004) decision = "increase_priority";
    else if (delta < -0.004) decision = "decrease_priority";

    decisions[cat] = decision;
    explanations[cat] = explainLearningDecision({
      categoryLabel: entry.label,
      decision,
      effectiveness: eff,
    });
  }

  return {
    enabled: true,
    adaptiveInfluenceActive: adaptive,
    lastLearningRunAt: row.lastLearningRunAt?.toISOString() ?? null,
    categoriesAdjusted,
    categoriesSuppressed,
    sparseDataCategories,
    decisions,
    explanations,
    effectiveness,
    control: {
      frozen: row.controlFlags.frozen,
      lastManualResetAt: row.controlFlags.lastManualResetAt,
      lastFreezeAt: row.controlFlags.lastFreezeAt,
    },
  };
}
