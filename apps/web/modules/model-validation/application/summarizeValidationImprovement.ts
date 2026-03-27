import type { ValidationMetricsDelta } from "../domain/validation.types";

export type ValidationImprovementSummary = {
  biggestImprovements: { metric: string; delta: number | null }[];
  biggestRegressions: { metric: string; delta: number | null }[];
};

const LABEL: Record<keyof ValidationMetricsDelta, string> = {
  totalAgreementRate: "Total agreement %",
  trustAgreementRate: "Trust agreement %",
  dealAgreementRate: "Deal agreement %",
  riskAgreementRate: "Risk agreement %",
  falsePositiveHighTrustRate: "FP high trust rate",
  falsePositiveStrongOpportunityRate: "FP strong opportunity rate",
  averageFairnessRating: "Avg fairness",
  manualReviewRate: "Manual review rate",
  lowConfidenceDisagreementConcentration: "Low-conf disagreement concentration",
};

/** Rank improvements/regressions by absolute delta (deterministic). */
export function summarizeValidationImprovement(delta: ValidationMetricsDelta): ValidationImprovementSummary {
  const rows = (Object.keys(delta) as (keyof ValidationMetricsDelta)[]).map((k) => ({
    metric: LABEL[k],
    direction: delta[k].direction,
    d: delta[k].delta,
  }));

  const improvements = rows
    .filter((r) => r.direction === "improved" && r.d != null)
    .sort((a, b) => Math.abs(b.d ?? 0) - Math.abs(a.d ?? 0))
    .slice(0, 5)
    .map((r) => ({ metric: r.metric, delta: r.d ?? null }));

  const regressions = rows
    .filter((r) => r.direction === "worsened" && r.d != null)
    .sort((a, b) => Math.abs(b.d ?? 0) - Math.abs(a.d ?? 0))
    .slice(0, 5)
    .map((r) => ({ metric: r.metric, delta: r.d ?? null }));

  return { biggestImprovements: improvements, biggestRegressions: regressions };
}
