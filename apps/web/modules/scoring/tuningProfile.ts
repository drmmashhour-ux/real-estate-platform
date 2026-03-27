/**
 * LECIPM tuning profile — optional overlays for thresholds / multipliers / penalties.
 * Used by simulation and (when enabled) runtime scoring. Defaults = production behavior.
 */

import type { TrustLevelBand } from "@/modules/trust-score/domain/trustScore.types";

export type TrustBucketThresholds = {
  /** default 40 */
  mediumMin: number;
  /** default 65 */
  highMin: number;
  /** default 85 */
  verifiedMin: number;
};

export type ConfidenceMultiplierBands = {
  gte80: number;
  gte60: number;
  gte40: number;
  lt40: number;
};

/** Extra points subtracted from trust when issue code present (tuning pass). */
export type IssueCodePenaltyTable = Partial<
  Record<
    | "CONDO_MISSING_UNIT"
    | "MEDIA_NONE"
    | "MEDIA_SPARSE"
    | "MEDIA_DUPLICATE"
    | "ADDR_INVALID"
    | "DECLARATION_INCOMPLETE"
    | "LEGAL_HIGH_RISK",
    number
  >
> &
  Record<string, number | undefined>;

export type EliteRecommendationPolicy = {
  insufficientDataConfidenceMax: number;
  /** Below this trust score → CAUTION (legacy path before deal tiers). */
  trustBelowReturnsCaution: number;
  strongScoreMin: number;
  strongConfidenceMin: number;
  worthReviewingScoreMin: number;
  cautionScoreMin: number;
  /**
   * When set (e.g. 50): if trust below this, recommendation is at most CAUTION.
   * Null = feature off (use trustBelowReturnsCaution only).
   */
  trustCapRecommendationBelow: number | null;
  /** Never emit STRONG_OPPORTUNITY if deal confidence is below this (e.g. 45). */
  minConfidenceForStrongOpportunity: number | null;
  /** If fraud score >= this, downgrade recommendation one level. */
  fraudScoreDowngradeAt: number | null;
  /** Need at least this many comparables for STRONG_OPPORTUNITY. */
  minComparablesForStrongOpportunity: number | null;
};

export type TuningProfileConfig = {
  trustBucketThresholds?: TrustBucketThresholds | null;
  confidenceMultiplierBands?: ConfidenceMultiplierBands | null;
  issueCodePenalties?: IssueCodePenaltyTable | null;
  eliteRecommendation?: Partial<EliteRecommendationPolicy> | null;
  /** Optional fraud risk bands for agreement / UI only (simulation uses live fraud score). */
  fraudRiskMediumMin?: number | null;
  fraudRiskHighMin?: number | null;
};

export const DEFAULT_CONFIDENCE_MULTIPLIER_BANDS: ConfidenceMultiplierBands = {
  gte80: 1.0,
  gte60: 0.9,
  gte40: 0.75,
  lt40: 0.6,
};

export const DEFAULT_TRUST_BUCKET_THRESHOLDS: TrustBucketThresholds = {
  mediumMin: 40,
  highMin: 65,
  verifiedMin: 85,
};

/** Mirrors current pickEliteRecommendation + documented extensions (extensions default off). */
export const DEFAULT_ELITE_RECOMMENDATION_POLICY: EliteRecommendationPolicy = {
  insufficientDataConfidenceMax: 40,
  trustBelowReturnsCaution: 45,
  strongScoreMin: 70,
  strongConfidenceMin: 80,
  worthReviewingScoreMin: 70,
  cautionScoreMin: 40,
  trustCapRecommendationBelow: null,
  minConfidenceForStrongOpportunity: null,
  fraudScoreDowngradeAt: null,
  minComparablesForStrongOpportunity: null,
};

export function confidenceMultiplierWithProfile(confidence: number, bands: ConfidenceMultiplierBands | null | undefined): number {
  const b = bands ?? DEFAULT_CONFIDENCE_MULTIPLIER_BANDS;
  const c = Math.min(100, Math.max(0, confidence));
  if (c >= 80) return b.gte80;
  if (c >= 60) return b.gte60;
  if (c >= 40) return b.gte40;
  return b.lt40;
}

export function trustLevelBandWithThresholds(score: number, t: TrustBucketThresholds | null | undefined): TrustLevelBand {
  const th = t ?? DEFAULT_TRUST_BUCKET_THRESHOLDS;
  if (score >= th.verifiedMin) return "verified";
  if (score >= th.highMin) return "high";
  if (score >= th.mediumMin) return "medium";
  return "low";
}

export function sumIssueCodePenalties(issueCodes: string[], table: IssueCodePenaltyTable | null | undefined): number {
  if (!table) return 0;
  let sum = 0;
  for (const code of issueCodes) {
    const v = table[code];
    if (typeof v === "number" && !Number.isNaN(v)) sum += v;
  }
  return sum;
}

export function mergeElitePolicy(overrides: Partial<EliteRecommendationPolicy> | null | undefined): EliteRecommendationPolicy {
  return { ...DEFAULT_ELITE_RECOMMENDATION_POLICY, ...overrides };
}
