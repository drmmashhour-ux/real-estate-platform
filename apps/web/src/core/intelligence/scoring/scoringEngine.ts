import type { IntelligenceScores, IntelligenceSignals } from "@/src/core/intelligence/types/intelligence.types";

function clamp100(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function weighted(parts: Array<{ value: number; weight: number }>) {
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  if (total <= 0) return 0;
  return clamp100(parts.reduce((sum, p) => sum + p.value * p.weight, 0) / total);
}

export function computeScores(signals: IntelligenceSignals): IntelligenceScores {
  const dealScore = weighted([
    { value: signals.price_vs_market.value, weight: 0.28 },
    { value: signals.rental_demand.value, weight: 0.27 },
    { value: signals.location_score.value, weight: 0.25 },
    { value: 100 - signals.fraud_risk_signal.value, weight: 0.2 },
  ]);

  const trustScore = weighted([
    { value: signals.document_completeness.value, weight: 0.55 },
    { value: 100 - signals.fraud_risk_signal.value, weight: 0.25 },
    { value: signals.freshness_signal.value, weight: 0.2 },
  ]);

  const riskScore = weighted([
    { value: signals.fraud_risk_signal.value, weight: 0.65 },
    { value: 100 - signals.document_completeness.value, weight: 0.2 },
    { value: 100 - signals.freshness_signal.value, weight: 0.15 },
  ]);

  const confidenceScore = weighted([
    { value: signals.document_completeness.value, weight: 0.4 },
    { value: signals.freshness_signal.value, weight: 0.35 },
    { value: signals.engagement_signal.value, weight: 0.25 },
  ]);

  return { dealScore, trustScore, riskScore, confidenceScore };
}
