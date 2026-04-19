/**
 * Trial snapshot embed — eligibility + optional activation for approved trials.
 */

import { growthAutonomyFlags } from "@/config/feature-flags";
import type { GrowthAutonomyMode, GrowthAutonomyRolloutStage } from "./growth-autonomy.types";
import { evaluateAdjacentInternalTrialEligibility } from "./growth-autonomy-trial-eligibility.service";
import { executeAdjacentInternalTrialIfReady } from "./growth-autonomy-trial-execution.service";
import {
  getGrowthAutonomyTrialApprovalRecord,
} from "./growth-autonomy-trial-state.repository";
import type { GrowthAutonomyTrialSnapshot } from "./growth-autonomy-trial.types";
import { getEnforcementForTarget } from "./growth-policy-enforcement-query.service";
import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";
import { recordGrowthAutonomyTrialSnapshotEvaluated } from "./growth-autonomy-monitoring.service";

export async function buildGrowthAutonomyTrialSnapshotEmbed(args: {
  enforcementSnapshot: GrowthPolicyEnforcementSnapshot | null;
  enforcementInputPartial: boolean;
  autonomyMode: GrowthAutonomyMode;
  rolloutStage: GrowthAutonomyRolloutStage;
  killSwitch: boolean;
}): Promise<GrowthAutonomyTrialSnapshot | undefined> {
  if (!growthAutonomyFlags.growthAutonomyTrialV1) return undefined;

  try {
    recordGrowthAutonomyTrialSnapshotEvaluated();
  } catch {
    /* noop */
  }

  const trialFreeze = growthAutonomyFlags.growthAutonomyTrialFreeze;
  const expansionFreeze = growthAutonomyFlags.growthAutonomyExpansionFreeze;

  const approval = getGrowthAutonomyTrialApprovalRecord();
  const slotBusy =
    !!approval &&
    (approval.activationStatus === "approved_internal_trial" || approval.activationStatus === "active");

  const evaluated = await evaluateAdjacentInternalTrialEligibility({
    enforcementSnapshot: args.enforcementSnapshot,
    enforcementInputPartial: args.enforcementInputPartial,
    missingDataWarnings: args.enforcementSnapshot?.missingDataWarnings ?? [],
    autonomyMode: args.autonomyMode,
    rolloutStage: args.rolloutStage,
    trialFeatureOn: growthAutonomyFlags.growthAutonomyTrialV1,
    killSwitch: args.killSwitch,
    trialFreeze,
    expansionFreeze,
    trialAlreadyActiveOrApproved: slotBusy,
  });

  const enf =
    args.enforcementSnapshot ?
      getEnforcementForTarget("panel_render_hint", args.enforcementSnapshot)
    : null;
  const policyAllowsTrial = !!enf && enf.mode !== "block" && enf.mode !== "freeze";

  /** Approved trials activate even when eligibility shows hold (slot occupied by self). */
  const gatesAllowExecution =
    !!approval &&
    approval.activationStatus === "approved_internal_trial" &&
    policyAllowsTrial &&
    !trialFreeze &&
    args.rolloutStage === "internal" &&
    args.autonomyMode === "SAFE_AUTOPILOT" &&
    !!args.enforcementSnapshot &&
    !args.killSwitch;

  await executeAdjacentInternalTrialIfReady({ gatesAllowExecution });

  const approvalAfter = getGrowthAutonomyTrialApprovalRecord();

  let activationBlockedReason: string | null = null;
  if (args.rolloutStage !== "internal") {
    activationBlockedReason = "Trial activation requires FEATURE_GROWTH_AUTONOMY_ROLLOUT=internal.";
  } else if (args.autonomyMode !== "SAFE_AUTOPILOT") {
    activationBlockedReason = "Trial activation requires autonomy mode SAFE_AUTOPILOT.";
  } else if (trialFreeze) {
    activationBlockedReason = "FEATURE_GROWTH_AUTONOMY_TRIAL_FREEZE is on.";
  } else if (!policyAllowsTrial && args.enforcementSnapshot) {
    activationBlockedReason = `Policy blocks trial while panel_render_hint is ${enf?.mode ?? "unknown"}.`;
  } else if (
    evaluated.outcome !== "eligible_for_internal_trial" &&
    evaluated.outcome !== "hold" &&
    evaluated.outcome !== "rollback_candidate"
  ) {
    activationBlockedReason = evaluated.explanation.whyEligibleOrNot;
  }

  const operatorNotes: string[] = [...evaluated.outcome === "eligible_for_internal_trial" ? [
      "Eligible candidate — operator approval required before any trial artifact is recorded.",
    ] : []];

  return {
    trialLayerEnabled: true,
    trialFreezeActive: trialFreeze,
    rolloutAllowsTrialActivation: args.rolloutStage === "internal",
    autonomyModeAllowsTrial: args.autonomyMode === "SAFE_AUTOPILOT",
    eligibilityOutcome: evaluated.outcome,
    explanation: evaluated.explanation,
    selectedCandidate: evaluated.selectedCandidate,
    holdCandidates: evaluated.holdCandidates,
    approval: approvalAfter,
    activationBlockedReason,
    operatorNotes,
  };
}
