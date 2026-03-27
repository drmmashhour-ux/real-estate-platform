import type { CalibrationMetrics, MetricDeltaDirection, MetricDeltaEntry, ValidationMetricsDelta } from "../domain/validation.types";

const EPS = 0.004;

function directionForDelta(
  delta: number,
  higherIsBetter: boolean,
): MetricDeltaDirection {
  if (Math.abs(delta) < EPS) return "unchanged";
  if (higherIsBetter) {
    if (delta > EPS) return "improved";
    if (delta < -EPS) return "worsened";
    return "unchanged";
  }
  if (delta < -EPS) return "improved";
  if (delta > EPS) return "worsened";
  return "unchanged";
}

function entry(
  base: number | null,
  comparison: number | null,
  higherIsBetter: boolean,
): MetricDeltaEntry {
  if (base == null && comparison == null) {
    return { base: null, comparison: null, delta: null, direction: "unchanged" };
  }
  const b = base ?? 0;
  const c = comparison ?? 0;
  const delta = c - b;
  return {
    base,
    comparison,
    delta,
    direction: directionForDelta(delta, higherIsBetter),
  };
}

/** Deterministic deltas for calibration metrics (same definition as `computeCalibrationMetrics`). */
export function buildValidationMetricsDelta(
  base: CalibrationMetrics,
  comparison: CalibrationMetrics,
): ValidationMetricsDelta {
  return {
    totalAgreementRate: entry(base.totalAgreementRate, comparison.totalAgreementRate, true),
    trustAgreementRate: entry(base.trustAgreementRate, comparison.trustAgreementRate, true),
    dealAgreementRate: entry(base.dealAgreementRate, comparison.dealAgreementRate, true),
    riskAgreementRate: entry(base.riskAgreementRate, comparison.riskAgreementRate, true),
    falsePositiveHighTrustRate: entry(base.falsePositiveHighTrustRate, comparison.falsePositiveHighTrustRate, false),
    falsePositiveStrongOpportunityRate: entry(
      base.falsePositiveStrongOpportunityRate,
      comparison.falsePositiveStrongOpportunityRate,
      false,
    ),
    averageFairnessRating: entry(base.averageFairnessRating, comparison.averageFairnessRating, true),
    manualReviewRate: entry(base.manualReviewRate, comparison.manualReviewRate, false),
    lowConfidenceDisagreementConcentration: entry(
      base.lowConfidenceDisagreementConcentration,
      comparison.lowConfidenceDisagreementConcentration,
      true,
    ),
  };
}
