import type { CalibrationMetrics } from "@/modules/model-validation/domain/validation.types";

export type MetricDelta = {
  key: keyof CalibrationMetrics;
  before: number | null;
  after: number | null;
  delta: number | null;
};

export function compareTuningMetrics(before: CalibrationMetrics, after: CalibrationMetrics): MetricDelta[] {
  const keys: (keyof CalibrationMetrics)[] = [
    "totalAgreementRate",
    "trustAgreementRate",
    "dealAgreementRate",
    "riskAgreementRate",
    "falsePositiveHighTrustRate",
    "falsePositiveStrongOpportunityRate",
    "manualReviewRate",
    "averageFairnessRating",
  ];

  return keys.map((key) => {
    const b = before[key];
    const a = after[key];
    const bn = typeof b === "number" ? b : null;
    const an = typeof a === "number" ? a : null;
    return {
      key,
      before: bn,
      after: an,
      delta: bn != null && an != null ? an - bn : null,
    };
  });
}
