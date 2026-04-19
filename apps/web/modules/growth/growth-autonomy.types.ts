/**
 * Growth autonomy framework — advisory-first modes, bounded catalog, operator-visible outcomes.
 * Does not expand enforcement domains; orchestrates visibility + readiness only (no risky execution).
 */

import type {
  GrowthAutonomyAutoLowRiskUiContext,
  GrowthAutonomyExecutionMeta,
} from "./growth-autonomy-auto.types";
import type { GrowthAutonomyLearningSnapshot } from "./growth-autonomy-learning.types";
import type { GrowthAutonomyTrialSnapshot } from "./growth-autonomy-trial.types";
import type { GrowthEnforcementMode } from "./growth-policy-enforcement.types";

/** Operator-facing autonomy tier for growth surfaces. */
export type GrowthAutonomyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT";

/** How a suggestion or action may be presented under current mode + policy. */
export type GrowthAutonomyDisposition =
  | "hidden"
  | "suggest_only"
  | /** @deprecated prefer prefilled_only */ "prefilled_action"
  | "prefilled_only"
  | "approval_required"
  | "blocked"
  | "trial_eligible"
  | "trial_active";

export function isGrowthAutonomyPrefilledDisposition(d: GrowthAutonomyDisposition): boolean {
  return d === "prefilled_action" || d === "prefilled_only";
}

/** Bounded catalog types for this phase — no payments, bookings core, ads core, CRO core, or unsafe sends. */
export type GrowthAutonomyActionType =
  | "suggest_strategy_promotion"
  | "suggest_content_improvement"
  | "suggest_messaging_assist"
  | "suggest_fusion_review"
  | "suggest_simulation_followup"
  | "prefill_operator_action"
  | "request_manual_review";

export type GrowthAutonomyRolloutStage = "off" | "internal" | "partial" | "full";

/** Mirrors GET /api/growth/autonomy `rolloutStatus` — why autonomy is visible or not. */
export type GrowthAutonomyApiRolloutStatus = {
  rolloutMode: GrowthAutonomyRolloutStage;
  autonomyEnabled: boolean;
  panelEnabled: boolean;
  killSwitchEnabled: boolean;
  enforcementAvailable: boolean;
  internalGateBlocked: boolean;
  snapshotDelivered: boolean;
  viewerInternalPilotEligible: boolean;
  partialExposureNote: string | null;
};

export type GrowthAutonomyPrefillKind = "open_panel" | "copy_text" | "navigate_path";

/** Safe operator affordance — navigation/copy only; never executes payments or core mutations. */
export type GrowthAutonomyPrefill = {
  kind: GrowthAutonomyPrefillKind;
  label: string;
  /** Dashboard-relative path (e.g. `/en/ca/dashboard/growth`) */
  href?: string;
  copyText?: string;
};

/** Deterministic explanation blocks for operators — no vague AI prose. */
export type GrowthAutonomyExplanation = {
  whySuggested: string;
  whyBlockedOrAllowed: string;
  whatNext: string;
};

export type GrowthAutonomySuggestion = {
  id: string;
  actionType: GrowthAutonomyActionType;
  label: string;
  targetKey: string;
  explanation: GrowthAutonomyExplanation;
  confidence: number;
  enforcementTargetMode: GrowthEnforcementMode;
  enforcementTargetKey: string;
  disposition: GrowthAutonomyDisposition;
  allowed: boolean;
  policyNote: string;
  prefill?: GrowthAutonomyPrefill;
  /** Learning loop ordering score (confidence + bounded delta); advisory-only. */
  learningRankScore?: number;
  /** Operator-readable note when learning adjusts ordering or soft-suppresses advisory rows. */
  learningNote?: string | null;
  /** Phase-1 low-risk auto-eligibility metadata (bounded allowlist — never expands domains). */
  execution?: GrowthAutonomyExecutionMeta;
};

export type GrowthAutonomySnapshot = {
  autonomyLayerEnabled: boolean;
  autonomyMode: GrowthAutonomyMode;
  rolloutStage: GrowthAutonomyRolloutStage;
  killSwitchActive: boolean;
  /** Policy enforcement snapshot was loaded (flag on and build succeeded). */
  enforcementSnapshotPresent: boolean;
  /** Enforcement feature flag — when false, autonomy operates without policy wiring. */
  enforcementLayerFlagOn: boolean;
  enforcementInputPartial: boolean;
  suggestions: GrowthAutonomySuggestion[];
  counts: {
    surfaced: number;
    blocked: number;
    approvalRequired: number;
    hidden: number;
    prefilled: number;
  };
  operatorNotes: string[];
  scopeExclusions: string[];
  createdAt: string;
  /** Populated when FEATURE_GROWTH_AUTONOMY_LEARNING_V1 is on — bounded prioritization summary. */
  learning?: GrowthAutonomyLearningSnapshot;
  /** Populated when auto-low-risk flag is on — cohort + rollout hints for operators. */
  autoLowRisk?: GrowthAutonomyAutoLowRiskUiContext;
  /** Single adjacent internal trial metadata — FEATURE_GROWTH_AUTONOMY_TRIAL_V1. */
  trial?: GrowthAutonomyTrialSnapshot;
};
