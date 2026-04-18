/**
 * Growth auto-learning — local orchestration weights & outcome linkage (advisory).
 */

import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";

export type GrowthLearningSource =
  | "leads"
  | "ads"
  | "cro"
  | "content"
  | "autopilot"
  | "fusion"
  | "governance";

export type GrowthLearningSignal = {
  id: string;
  source: GrowthLearningSource;
  title: string;
  why?: string;
  impact: "low" | "medium" | "high";
  confidence?: number;
  priorityScore?: number;
  createdAt: string;
};

export type GrowthLearningOutcome = {
  signalId: string;
  outcomeType: "positive" | "negative" | "neutral" | "insufficient_data";
  outcomeValue?: number;
  rationale: string;
  observedAt: string;
};

export type GrowthLearningWeights = {
  impactWeight: number;
  confidenceWeight: number;
  signalStrengthWeight: number;
  recencyWeight: number;
  governancePenaltyWeight: number;
  defaultBiasWeight: number;
  updatedAt: string;
};

export type GrowthLearningSummary = {
  runs: number;
  signalsEvaluated: number;
  outcomesLinked: number;
  positiveRate: number;
  negativeRate: number;
  neutralRate: number;
  adjustmentsApplied: string[];
  warnings: string[];
  updatedAt: string;
};

/** API + dashboard payload for one learning cycle. */
export type GrowthLearningCycleResult = {
  summary: GrowthLearningSummary;
  weights: GrowthLearningWeights;
  signals: GrowthLearningSignal[];
  weightAdjustmentsApplied: string[];
  adaptiveWeightsEnabled: boolean;
  monitoringEnabled: boolean;
  /** Governance + learning control (advisory; gates weight updates in-cycle). */
  learningControl: GrowthLearningControlDecision;
};
