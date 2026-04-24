/** Self-evolving loop version — bump when interpretation of stored rows changes. */
export const EVOLUTION_ENGINE_VERSION = "v1.0.0";

export type EvolutionDomain = "BNHUB" | "LECIPM" | "SHARED" | "FUND" | "CAPITAL";

export type EvolutionMetricType =
  | "BOOKING"
  | "CONVERSION"
  | "PRICING"
  | "STRATEGY"
  | "RANKING"
  | "CUSTOM";

export type FeedbackAssessment = "BETTER_THAN_EXPECTED" | "ON_TARGET" | "WORSE_THAN_EXPECTED" | "INSUFFICIENT_DATA";

export type ReinforcementLabel = "SUCCESS" | "NEUTRAL" | "FAILURE";

/** Hard bounds for reinforcement memory — never outside this range. */
export const REINFORCEMENT_SCORE_MIN = 0.08;
export const REINFORCEMENT_SCORE_MAX = 0.92;

/** Max delta applied per outcome event (safe micro-steps). */
export const REINFORCEMENT_STEP_CAP = 0.025;

/** Policy numeric knobs — relative deltas proposed only via EvolutionPolicyAdjustment approval. */
export const POLICY_WEIGHT_DELTA_CAP = 0.05;
