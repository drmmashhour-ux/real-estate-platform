/**
 * Measurement + governance outcomes for the single adjacent internal trial (no activation implied).
 */

import type { GrowthAutonomyAdjacentTrialActionType } from "./growth-autonomy-trial.types";

/** Governance outcome — never triggers automatic expansion by itself. */
export type GrowthAutonomyTrialDecision =
  | "keep_internal"
  | "hold"
  | "rollback"
  | "eligible_for_future_review"
  | "insufficient_data";

export type GrowthAutonomyTrialMeasurementWindow = {
  startedAt: string | null;
  endedAt: string | null;
  observationDays: number;
};

export type GrowthAutonomyTrialSafetyLevel = "safe" | "caution" | "unsafe";

export type GrowthAutonomyTrialSafetySignal = {
  level: GrowthAutonomyTrialSafetyLevel;
  reasons: string[];
  auditGapSuspected: boolean;
  killOrFreezeDuringWindow: boolean;
};

export type GrowthAutonomyTrialUsefulnessBand = "strong" | "good" | "weak" | "poor" | "insufficient_data";

export type GrowthAutonomyTrialOperatorFeedbackSummary = {
  helpful: number;
  notHelpful: number;
  confusing: number;
  undoneUnnecessary: number;
  rolledBackProblematic: number;
  total: number;
  positiveRate: number | null;
  confusionRate: number | null;
  undoIntentRate: number | null;
};

export type GrowthAutonomyTrialOutcomeSummary = {
  trialActionId: string;
  actionType: GrowthAutonomyAdjacentTrialActionType;
  activationWindow: GrowthAutonomyTrialMeasurementWindow;
  sampleSize: number;
  timesSurfacedInSnapshots: number;
  operatorFeedback: GrowthAutonomyTrialOperatorFeedbackSummary;
  completionSignals: {
    approvalsRecorded: number;
    executionsCompleted: number;
    rollbacksCompleted: number;
    deniesRecorded: number;
  };
  metrics: {
    usageProxyRate: number | null;
    completionFollowThroughRate: number | null;
    undoRollbackRate: number | null;
    sparseData: boolean;
  };
  safety: GrowthAutonomyTrialSafetySignal;
  usefulnessBand: GrowthAutonomyTrialUsefulnessBand;
  finalDecision: GrowthAutonomyTrialDecision;
  explanation: string;
  operatorLines: string[];
  computedAt: string;
};

export type GrowthAutonomyTrialResult = GrowthAutonomyTrialOutcomeSummary;
