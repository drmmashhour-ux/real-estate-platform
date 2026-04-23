/**
 * Centralized forecast knobs — transparent, adjustable without code churn in formulas.
 * All monetary math elsewhere uses cents.
 */

import type { PipelineStage } from "./revenue-predictor.types";

/** Probability weight for expected close from open pipeline at each stage (not additive to 100 — used in blend). */
export const STAGE_CLOSE_WEIGHT: Record<PipelineStage, number> = {
  NEW_LEAD: 0.06,
  CONTACTED: 0.12,
  DEMO_SCHEDULED: 0.22,
  QUALIFIED: 0.38,
  OFFER: 0.62,
  CLOSED_WON: 1,
  CLOSED_LOST: 0,
};

/** Relative risk of loss / stall by stage (for opportunity-loss heuristic). */
export const STAGE_STALL_RISK: Record<PipelineStage, number> = {
  NEW_LEAD: 0.35,
  CONTACTED: 0.28,
  DEMO_SCHEDULED: 0.2,
  QUALIFIED: 0.14,
  OFFER: 0.08,
  CLOSED_WON: 0,
  CLOSED_LOST: 1,
};

/** Influence of normalized scores (0–100) on close probability modifier. Small on purpose — avoid fake precision. */
export const SCORE_INFLUENCE_WEIGHTS = {
  callQuality: 0.0012,
  control: 0.001,
  closing: 0.0014,
  training: 0.0008,
  objectionHandling: 0.001,
} as const;

/** Trend multipliers applied to weighted close probability (bounded). */
export const TREND_MULTIPLIER_BOUNDS = {
  up: { min: 1.02, max: 1.08 },
  flat: { min: 0.98, max: 1.02 },
  down: { min: 0.92, max: 0.98 },
} as const;

/** Coaching uplift: implied lift to effective close prob when scores improve toward targets. */
export const COACHING_UPLIFT = {
  scoreGapPerPointLift: 0.0015,
  maxUpliftPct: 0.18,
  minUpliftPct: 0.02,
} as const;

/** Confidence thresholds (sample depth). */
export const CONFIDENCE_THRESHOLDS = {
  highMinCalls: 18,
  highMinDeals: 8,
  mediumMinCalls: 8,
  mediumMinDeals: 3,
} as const;

/** Forecast range spread around base (multiplicative). */
export const RANGE_SPREAD = {
  conservative: 0.82,
  upside: 1.14,
} as const;

/** Context demand/seasonality bounds. */
export const CONTEXT_BOUNDS = {
  seasonality: { min: 0.92, max: 1.08 },
  demand: { min: 0.88, max: 1.1 },
} as const;
