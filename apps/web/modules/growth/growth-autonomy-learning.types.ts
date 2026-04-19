/**
 * Growth autonomy learning loop — bounded prioritization only (no new execution domains).
 */

export type GrowthAutonomyRecommendationCategory =
  | "strategy"
  | "content"
  | "messaging"
  | "fusion"
  | "simulation"
  | "manual_review"
  | "operator_assistance"
  | "generic";

/** Effectiveness band — never fabricates certainty. */
export type GrowthAutonomyEffectivenessScoreBand = "strong" | "good" | "weak" | "poor" | "insufficient_data";

export type GrowthAutonomyLearningDecision =
  | "increase_priority"
  | "neutral"
  | "decrease_priority"
  | "suppress_temporarily"
  | "manual_review_queue";

export type GrowthAutonomyInteractionState =
  | "shown"
  | "interacted"
  | "prefill_used"
  | "completed"
  | "ignored"
  | "feedback_helpful"
  | "feedback_not_helpful"
  | "confusion";

/** Single outcome / learning observation (also persisted as DB row). */
export type GrowthAutonomyOutcomeRecord = {
  suggestionId: string;
  categoryId: string;
  category: GrowthAutonomyRecommendationCategory;
  targetKey: string;
  timestamp: string;
  interaction: GrowthAutonomyInteractionState;
  completionState: "unknown" | "completed" | "not_completed";
  baselineMetric?: unknown;
  postActionMetric?: unknown;
  metricWindow?: "unknown" | "bounded";
  confidence: number;
  evaluationResult: "positive" | "neutral" | "negative" | "insufficient_data";
  learningNotes: string;
};

export type GrowthAutonomyLearningRecord = GrowthAutonomyOutcomeRecord & {
  id?: string;
  operatorUserId?: string | null;
};

export type GrowthAutonomyEffectivenessScore = {
  category: GrowthAutonomyRecommendationCategory;
  band: GrowthAutonomyEffectivenessScoreBand;
  /** Bounded 0–1 derived from observable rates only; undefined when insufficient_data. */
  numericScore?: number;
  interactionRate?: number;
  completionRate?: number;
  positiveFeedbackRate?: number;
  negativeFeedbackRate?: number;
  confusionRate?: number;
  observationCount: number;
};

/** Aggregates stored in JSON — extended only additively. */
export type GrowthAutonomyCategoryAggregate = {
  shown: number;
  interacted: number;
  prefillUsed: number;
  completed: number;
  helpfulYes: number;
  helpfulNo: number;
  confusion: number;
  ignored: number;
};

export type GrowthAutonomyLearningControlFlags = {
  frozen: boolean;
  lastManualResetAt?: string;
  lastFreezeAt?: string;
};

/** Snapshot attached to autonomy API for UI / audit. */
export type GrowthAutonomyLearningSnapshot = {
  enabled: boolean;
  /** No adaptive influence (kill switch, flag off, or frozen). */
  adaptiveInfluenceActive: boolean;
  lastLearningRunAt: string | null;
  categoriesAdjusted: number;
  categoriesSuppressed: number;
  sparseDataCategories: number;
  decisions: Partial<Record<GrowthAutonomyRecommendationCategory, GrowthAutonomyLearningDecision>>;
  explanations: Partial<Record<GrowthAutonomyRecommendationCategory, string>>;
  effectiveness: Partial<Record<GrowthAutonomyRecommendationCategory, GrowthAutonomyEffectivenessScore>>;
  /** Operator audit — manual freeze / reset timestamps (optional for backward compatibility). */
  control?: Pick<GrowthAutonomyLearningControlFlags, "frozen" | "lastManualResetAt" | "lastFreezeAt">;
};

/** Per-catalog weight used only for ordering within safe bounds. */
export type GrowthAutonomyRecommendationWeight = {
  categoryId: string;
  delta: number;
  suppressedUntil: number | null;
};
