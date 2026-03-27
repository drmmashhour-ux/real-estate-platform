import type { ClusterAnalysis } from "../domain/tuning.types";

/**
 * Heuristic text suggestions only — human review required before editing `TuningProfileConfig`.
 */
export function proposeThresholdAdjustments(clusters: ClusterAnalysis[]): string[] {
  const byId = Object.fromEntries(clusters.map((c) => [c.cluster, c.count])) as Record<string, number>;
  const out: string[] = [];

  if ((byId.false_positive_strong_opportunity ?? 0) > 0) {
    out.push(
      "Strong-opportunity false positives: consider raising `eliteRecommendation.strongScoreMin` / `strongConfidenceMin`, or set `minConfidenceForStrongOpportunity` (e.g. 45).",
    );
    out.push("Review `confidenceMultiplierBands` for 40–59 and <40 buckets — downgrades often help before raising deal thresholds.");
  }

  if ((byId.false_positive_high_trust ?? 0) > 0) {
    out.push(
      "High-trust false positives: increase `issueCodePenalties` for CONDO_MISSING_UNIT / MEDIA_* / declaration codes before raising `trustBucketThresholds.highMin`.",
    );
  }

  if ((byId.false_negative_high_trust ?? 0) > 0) {
    out.push(
      "False negatives on trust: penalties may be too harsh — reduce targeted `issueCodePenalties` or slightly lower `trustBucketThresholds.highMin` after checking incomplete-but-honest listings.",
    );
  }

  if ((byId.false_negative_strong_opportunity ?? 0) > 0) {
    out.push(
      "Deal false negatives: consider lowering `worthReviewingScoreMin` slightly or relaxing conflict penalty path — verify comps quality first.",
    );
  }

  if ((byId.low_confidence_disagreement ?? 0) > 0) {
    out.push(
      "Low-confidence disagreements: tighten confidence multipliers (e.g. 0.75→0.70 for 40–59) before changing headline thresholds.",
    );
  }

  if ((byId.suspicious_missed_cases ?? 0) > 0) {
    out.push(
      "Risk mismatches: set `eliteRecommendation.fraudScoreDowngradeAt` and/or review fraud escalation thresholds in tuning profile.",
    );
  }

  if (out.length === 0) {
    out.push("No dominant cluster — collect more human labels or inspect individual disagreements in the validation table.");
  }

  return out;
}
