/**
 * Maps estimate + risk posture to a simple advisory label — no automation.
 */

import type {
  GrowthSimulationConfidence,
  GrowthSimulationEstimate,
  GrowthSimulationRisk,
} from "./growth-simulation.types";

export type GrowthSimulationRecommendationInput = {
  estimates: GrowthSimulationEstimate[];
  risks: GrowthSimulationRisk[];
  confidence: GrowthSimulationConfidence;
};

export function buildGrowthSimulationRecommendation(input: GrowthSimulationRecommendationInput): "consider" | "caution" | "defer" {
  const highRisks = input.risks.filter((r) => r.severity === "high").length;
  const medRisks = input.risks.filter((r) => r.severity === "medium").length;

  const avgDelta =
    input.estimates.length === 0
      ? 0
      : input.estimates.reduce((s, e) => s + Math.abs(e.estimatedDeltaPct ?? 0), 0) / input.estimates.length;

  if (input.confidence === "low" && (highRisks >= 1 || avgDelta < 4)) {
    return "defer";
  }

  if (highRisks >= 2 || (input.confidence === "low" && avgDelta < 7)) {
    return "defer";
  }

  if (highRisks >= 1 || medRisks >= 2 || input.confidence === "low") {
    return "caution";
  }

  if (avgDelta >= 8 && highRisks === 0) {
    return "consider";
  }

  return "caution";
}
