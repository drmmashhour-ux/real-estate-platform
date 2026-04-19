/**
 * Resolves whether each catalog row may use Phase-1 low-risk server auto-execution (allowlist + gates).
 */

import { growthAutonomyFlags } from "@/config/feature-flags";
import { computeEffectivenessForCategory } from "./growth-autonomy-effectiveness.service";
import { explainAutoDowngrade } from "./growth-autonomy-execution-explainer.service";
import { recordSparseDowngrade } from "./growth-autonomy-execution-monitoring.service";
import { getAllowlistedAutoAction } from "./growth-autonomy-auto-allowlist";
import { parseGrowthAutonomyAutoLowRiskMinConfidence } from "./growth-autonomy-auto-config";
import type { GrowthAutonomyLearningOrchestrationContext } from "./growth-autonomy-learning.service";
import { getGrowthAutonomyLearningStateRow } from "./growth-autonomy-learning.repository";
import { catalogIdToLearningCategory } from "./growth-autonomy-learning-category";
import type { GrowthAutonomyCategoryAggregate } from "./growth-autonomy-learning.types";
import type {
  GrowthAutonomyAutoCohortBucket,
  GrowthAutonomyAutoLowRiskRolloutStage,
  GrowthAutonomyAutoLowRiskUiContext,
  GrowthAutonomyExecutionClass,
  GrowthAutonomyExecutionMeta,
  GrowthAutonomyExecutionSafetyCheck,
} from "./growth-autonomy-auto.types";
import type {
  GrowthAutonomyDisposition,
  GrowthAutonomyMode,
  GrowthAutonomyRolloutStage,
  GrowthAutonomySuggestion,
} from "./growth-autonomy.types";

function baseExecutionClass(disposition: GrowthAutonomyDisposition): GrowthAutonomyExecutionClass {
  switch (disposition) {
    case "blocked":
      return "blocked";
    case "approval_required":
      return "approval_required";
    case "hidden":
      return "suggest_only";
    case "prefilled_action":
    case "prefilled_only":
      return "prefilled_only";
    default:
      return "suggest_only";
  }
}

function policyAllowsAuto(mode: GrowthAutonomySuggestion["enforcementTargetMode"]): boolean {
  return mode === "allow";
}

function approvalOrBlockFree(mode: GrowthAutonomySuggestion["enforcementTargetMode"]): boolean {
  return mode !== "block" && mode !== "freeze" && mode !== "approval_required";
}

export type AutoExecutionEnrichArgs = {
  suggestions: GrowthAutonomySuggestion[];
  autonomyMode: GrowthAutonomyMode;
  autonomyRolloutStage: GrowthAutonomyRolloutStage;
  killSwitchActive: boolean;
  autoRolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  autoLowRiskFlagOn: boolean;
  enforcementInputPartial: boolean;
  learnCtx: GrowthAutonomyLearningOrchestrationContext | null;
  viewerMayReceiveAutoExecution: boolean;
  /** When set, shown in the operator panel (from server auth context). */
  cohortBucket: GrowthAutonomyAutoCohortBucket | null;
};

export async function enrichGrowthAutonomySuggestionsWithAutoExecution(
  args: AutoExecutionEnrichArgs,
): Promise<{ suggestions: GrowthAutonomySuggestion[]; autoLowRisk: GrowthAutonomyAutoLowRiskUiContext }> {
  const minConf = parseGrowthAutonomyAutoLowRiskMinConfidence();

  let aggregatesByCategory: Record<string, GrowthAutonomyCategoryAggregate> = {};
  if (growthAutonomyFlags.growthAutonomyLearningV1) {
    try {
      const row = await getGrowthAutonomyLearningStateRow();
      aggregatesByCategory = row.aggregatesByCategory;
    } catch {
      aggregatesByCategory = {};
    }
  }

  const autoLowRisk: GrowthAutonomyAutoLowRiskUiContext = {
    featureFlagOn: args.autoLowRiskFlagOn,
    rolloutStage: args.autoRolloutStage,
    cohortBucket: args.cohortBucket,
    viewerMayReceiveAutoExecution: args.viewerMayReceiveAutoExecution,
  };

  if (
    !args.autoLowRiskFlagOn ||
    args.killSwitchActive ||
    args.autoRolloutStage === "off" ||
    args.autonomyRolloutStage === "off"
  ) {
    const effectiveOn =
      args.autoLowRiskFlagOn &&
      !args.killSwitchActive &&
      args.autoRolloutStage !== "off" &&
      args.autonomyRolloutStage !== "off";
    return {
      suggestions: args.suggestions.map((s) => ({ ...s, execution: attachMetaNoop(s, effectiveOn, minConf, args) })),
      autoLowRisk,
    };
  }

  const now = Date.now();
  const out: GrowthAutonomySuggestion[] = [];

  for (const s of args.suggestions) {
    const exec = await resolveExecutionMetaForSuggestion({
      suggestion: s,
      autonomyMode: args.autonomyMode,
      autonomyRolloutStage: args.autonomyRolloutStage,
      killSwitchActive: args.killSwitchActive,
      autoRolloutStage: args.autoRolloutStage,
      enforcementInputPartial: args.enforcementInputPartial,
      learnCtx: args.learnCtx,
      aggregatesByCategory,
      viewerMayReceiveAutoExecution: args.viewerMayReceiveAutoExecution,
      minConfidence: minConf,
      now,
    });
    out.push({ ...s, execution: exec });
  }

  return { suggestions: out, autoLowRisk };
}

function attachMetaNoop(
  s: GrowthAutonomySuggestion,
  flagOn: boolean,
  minConf: number,
  args: AutoExecutionEnrichArgs,
): GrowthAutonomyExecutionMeta {
  const base = baseExecutionClass(s.disposition);
  const safety = buildSafetyPlaceholder({
    suggestion: s,
    autonomyMode: args.autonomyMode,
    killSwitchActive: args.killSwitchActive,
    autoRolloutStage: args.autoRolloutStage,
    autonomyRolloutStage: args.autonomyRolloutStage,
    enforcementInputPartial: args.enforcementInputPartial,
    minConfidence: minConf,
    viewerMayReceiveAutoExecution: args.viewerMayReceiveAutoExecution,
    autoFeatureFlagOn: args.autoLowRiskFlagOn,
    flagOn,
    aggregatesEmpty: true,
    learnCtx: args.learnCtx,
    now: Date.now(),
  });
  const r: string[] = [];
  if (!args.autoLowRiskFlagOn) r.push("FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_V1 is off.");
  if (args.killSwitchActive) r.push("Autonomy kill switch is on.");
  if (args.autoRolloutStage === "off" || args.autonomyRolloutStage === "off")
    r.push("Autonomy or auto-low-risk rollout is off.");
  return {
    executionClass: base,
    resolvedExecutionClass: base,
    reversibility: "none",
    safety,
    holdReasons: r,
    downgradeExplanation: r.length > 0 ? explainAutoDowngrade({ reasons: r }) : undefined,
    operatorVisibilityAfterAutoNote:
      "Operators always retain visibility through this dashboard and the execution log — nothing runs silently.",
  };
}

function buildSafetyPlaceholder(p: {
  suggestion: GrowthAutonomySuggestion;
  autonomyMode: GrowthAutonomyMode;
  killSwitchActive: boolean;
  autoRolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  autonomyRolloutStage: GrowthAutonomyRolloutStage;
  enforcementInputPartial: boolean;
  minConfidence: number;
  viewerMayReceiveAutoExecution: boolean;
  autoFeatureFlagOn: boolean;
  flagOn: boolean;
  aggregatesEmpty: boolean;
  learnCtx: GrowthAutonomyLearningOrchestrationContext | null;
  now: number;
}): GrowthAutonomyExecutionSafetyCheck {
  const allowlisted = !!getAllowlistedAutoAction(p.suggestion.id);
  const suppressed =
    p.learnCtx?.suppressedUntilByCategory[p.suggestion.id] !== undefined &&
    (p.learnCtx.suppressedUntilByCategory[p.suggestion.id] ?? 0) > p.now;

  return {
    autonomyModeSafeAutopilot: p.autonomyMode === "SAFE_AUTOPILOT",
    autoRolloutAllowsExecution: p.autoRolloutStage !== "off" && p.autonomyRolloutStage !== "off",
    autoFeatureFlagOn: p.autoFeatureFlagOn,
    autonomyRolloutAllowsSnapshot: p.autonomyRolloutStage !== "off",
    actionAllowlisted: allowlisted,
    policyAllowsAuto: policyAllowsAuto(p.suggestion.enforcementTargetMode),
    approvalOrBlockFree: approvalOrBlockFree(p.suggestion.enforcementTargetMode),
    killSwitchOff: !p.killSwitchActive,
    learningNotSuppressingCategory: !suppressed,
    confidenceAboveThreshold: p.suggestion.confidence >= p.minConfidence,
    learningDataNotSparseForAuto: !p.aggregatesEmpty,
    feedbackNotStronglyNegative: true,
    cohortAllowsAutoExecution: p.viewerMayReceiveAutoExecution,
    enforcementSnapshotUsableForAuto: !p.enforcementInputPartial,
  };
}

async function resolveExecutionMetaForSuggestion(ctx: {
  suggestion: GrowthAutonomySuggestion;
  autonomyMode: GrowthAutonomyMode;
  autonomyRolloutStage: GrowthAutonomyRolloutStage;
  killSwitchActive: boolean;
  autoRolloutStage: GrowthAutonomyAutoLowRiskRolloutStage;
  enforcementInputPartial: boolean;
  learnCtx: GrowthAutonomyLearningOrchestrationContext | null;
  aggregatesByCategory: Record<string, GrowthAutonomyCategoryAggregate>;
  viewerMayReceiveAutoExecution: boolean;
  minConfidence: number;
  now: number;
}): Promise<GrowthAutonomyExecutionMeta> {
  const s = ctx.suggestion;
  const base = baseExecutionClass(s.disposition);
  const allow = getAllowlistedAutoAction(s.id);

  const cat = catalogIdToLearningCategory(s.id);
  const agg = ctx.aggregatesByCategory[s.id] ?? {
    shown: 0,
    interacted: 0,
    prefillUsed: 0,
    completed: 0,
    helpfulYes: 0,
    helpfulNo: 0,
    confusion: 0,
    ignored: 0,
  };
  const eff = computeEffectivenessForCategory({ category: cat, aggregate: agg });
  const learningSparse = eff.band === "insufficient_data";
  if (learningSparse) {
    try {
      recordSparseDowngrade();
    } catch {
      /* noop */
    }
  }

  const fbDenom = agg.helpfulYes + agg.helpfulNo;
  const stronglyNegativeFeedback =
    fbDenom >= 4 && agg.helpfulNo > agg.helpfulYes && agg.helpfulNo >= 3;

  const suppressedUntil = ctx.learnCtx?.suppressedUntilByCategory[s.id] ?? 0;
  const learningSuppresses = suppressedUntil > ctx.now;

  const safety: GrowthAutonomyExecutionSafetyCheck = {
    autonomyModeSafeAutopilot: ctx.autonomyMode === "SAFE_AUTOPILOT",
    autoRolloutAllowsExecution: ctx.autoRolloutStage !== "off" && ctx.autonomyRolloutStage !== "off",
    autoFeatureFlagOn: true,
    autonomyRolloutAllowsSnapshot: ctx.autonomyRolloutStage !== "off",
    actionAllowlisted: !!allow,
    policyAllowsAuto: policyAllowsAuto(s.enforcementTargetMode),
    approvalOrBlockFree: approvalOrBlockFree(s.enforcementTargetMode),
    killSwitchOff: !ctx.killSwitchActive,
    learningNotSuppressingCategory: !learningSuppresses,
    confidenceAboveThreshold: s.confidence >= ctx.minConfidence,
    learningDataNotSparseForAuto: !learningSparse,
    feedbackNotStronglyNegative: !stronglyNegativeFeedback,
    cohortAllowsAutoExecution: ctx.viewerMayReceiveAutoExecution,
    enforcementSnapshotUsableForAuto: !ctx.enforcementInputPartial,
  };

  const holdReasons: string[] = [];
  if (!safety.autonomyModeSafeAutopilot) holdReasons.push("Autonomy mode is not SAFE_AUTOPILOT.");
  if (!safety.autoRolloutAllowsExecution) holdReasons.push("Auto-low-risk rollout or base rollout is off.");
  if (!safety.actionAllowlisted) holdReasons.push("This catalog row is not on the low-risk auto allowlist.");
  if (!safety.policyAllowsAuto || !safety.approvalOrBlockFree) holdReasons.push("Policy blocks, freezes, or requires approval for this target.");
  if (!safety.killSwitchOff) holdReasons.push("Kill switch is active.");
  if (!safety.learningNotSuppressingCategory) holdReasons.push("Learning loop temporarily reduced visibility for this category.");
  if (!safety.confidenceAboveThreshold) holdReasons.push("Confidence is below the configured low-risk threshold.");
  if (!safety.learningDataNotSparseForAuto) holdReasons.push("Learning data is sparse for this category — holding neutral.");
  if (!safety.feedbackNotStronglyNegative) holdReasons.push("Recent operator feedback skews negative for this pattern.");
  if (!safety.cohortAllowsAutoExecution) holdReasons.push("Cohort or pilot gate does not include auto_low_risk execution for this viewer.");
  if (!safety.enforcementSnapshotUsableForAuto) holdReasons.push("Enforcement inputs are partial — no automatic internal writes.");

  let resolved: GrowthAutonomyExecutionClass = base;
  if (base === "blocked" || base === "approval_required") {
    resolved = base;
  } else if (holdReasons.length === 0 && (base === "prefilled_only" || base === "suggest_only")) {
    resolved = "auto_low_risk";
  } else if (base === "prefilled_only") {
    resolved = "prefilled_only";
  } else {
    resolved = "suggest_only";
  }

  const downgradeExplanation =
    holdReasons.length > 0 ? explainAutoDowngrade({ reasons: holdReasons }) : undefined;

  return {
    executionClass: base,
    resolvedExecutionClass: resolved,
    reversibility: allow?.reversibility === "reversible_internal" ? "reversible_internal" : "none",
    lowRiskActionKey: allow?.lowRiskActionKey,
    safety,
    holdReasons,
    downgradeExplanation,
    operatorVisibilityAfterAutoNote:
      "Operators always retain visibility through this dashboard and the execution log — nothing runs silently.",
  };
}
