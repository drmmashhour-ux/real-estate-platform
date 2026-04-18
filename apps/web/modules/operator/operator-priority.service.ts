import type { OperatorScoredRecommendation } from "./operator-v2.types";

export function scoreRecommendation(input: {
  trustScore: number;
  confidenceScore?: number;
  profitImpact?: number;
  urgencyScore?: number;
  actionType: string;
}): number {
  let score = 0;

  score += input.trustScore * 40;

  if (input.confidenceScore != null && Number.isFinite(input.confidenceScore)) {
    score += input.confidenceScore * 25;
  }

  if (input.profitImpact != null && Number.isFinite(input.profitImpact)) {
    score += Math.min(input.profitImpact, 1) * 20;
  }

  if (input.urgencyScore != null && Number.isFinite(input.urgencyScore)) {
    score += input.urgencyScore * 10;
  }

  if (input.actionType.includes("PAUSE")) score += 5;
  if (input.actionType.includes("SCALE")) score += 8;

  return Number(score.toFixed(2));
}

/** Extract normalized profit impact 0..1 from recommendation metrics when present. */
export function profitImpactFromMetrics(metrics: Record<string, unknown> | undefined): number | null {
  if (!metrics) return null;
  const v = metrics.profitImpact ?? metrics.profitScore ?? metrics.expectedProfitDelta;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(1, v));
}

/** Urgency 0..1 from metrics when present. */
export function urgencyFromMetrics(metrics: Record<string, unknown> | undefined): number | null {
  if (!metrics) return null;
  const v = metrics.urgencyScore ?? metrics.urgency;
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(1, v));
}

export function whyPrioritizedLine(s: OperatorScoredRecommendation): string {
  const parts = [
    `Trust-weighted base (${s.trustScore.toFixed(2)})`,
    s.confidenceScore != null ? `confidence (${s.confidenceScore.toFixed(2)})` : null,
    s.profitImpact != null ? `profit signal (≤1 → ${s.profitImpact.toFixed(2)})` : null,
    s.urgencyScore != null ? `urgency (${s.urgencyScore.toFixed(2)})` : null,
    s.actionType.includes("SCALE") ? "SCALE boost" : null,
    s.actionType.includes("PAUSE") ? "PAUSE boost" : null,
  ].filter(Boolean);
  return `Priority ${s.priorityScore.toFixed(2)}: ${parts.join(" · ")}.`;
}
