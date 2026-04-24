/**
 * Bounded self-improvement — prevents runaway strategic drift (configurable via env).
 */
export const COMPANY_AI_BOUNDS = {
  /** Max absolute delta for numeric weight shifts in a single adaptation (e.g. 0.12 = 12 points). */
  maxWeightDelta: Number(process.env.COMPANY_AI_MAX_WEIGHT_DELTA ?? "0.12"),
  /** Max proposed adaptations emitted per `generateCompanyAdaptations` run. */
  maxAdaptationsPerReview: Number(process.env.COMPANY_AI_MAX_ADAPTATIONS_PER_REVIEW ?? "5"),
  /** Minimum aggregate sample (deals+bookings) in window to allow "strong" pattern confidence. */
  minSampleStrongPattern: Number(process.env.COMPANY_AI_MIN_SAMPLE_STRONG ?? "30"),
  /** Minimum sample for any pattern to surface above noise floor. */
  minSampleWeakPattern: Number(process.env.COMPANY_AI_MIN_SAMPLE_WEAK ?? "8"),
  /** Penalty applied to domains with recent rejected adaptations (count in window). */
  rejectedAdaptationPenalty: Number(process.env.COMPANY_AI_REJECT_PENALTY ?? "0.15"),
} as const;

export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Clamp a proposed weight delta to configured cap. */
export function applyWeightDeltaCap(current: number, proposed: number): number {
  const delta = proposed - current;
  const capped = clampNumber(delta, -COMPANY_AI_BOUNDS.maxWeightDelta, COMPANY_AI_BOUNDS.maxWeightDelta);
  return current + capped;
}

export function confidenceAfterSampleAdjust(rawConfidence: number, sampleSize: number): number {
  if (sampleSize >= COMPANY_AI_BOUNDS.minSampleStrongPattern) return clampNumber(rawConfidence, 0, 1);
  if (sampleSize < COMPANY_AI_BOUNDS.minSampleWeakPattern) return 0;
  const t =
    (sampleSize - COMPANY_AI_BOUNDS.minSampleWeakPattern) /
    (COMPANY_AI_BOUNDS.minSampleStrongPattern - COMPANY_AI_BOUNDS.minSampleWeakPattern);
  return clampNumber(rawConfidence * t, 0, 0.85);
}
