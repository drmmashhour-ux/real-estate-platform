/**
 * Swarm aggregate scores — bounded heuristics; does not alter Brain/Operator weights.
 */
import type { SwarmAggregateScores, SwarmProposal } from "./swarm-system.types";

const W = { confidence: 0.25, priority: 0.25, risk: 0.2, evidence: 0.2, exec: 0.1 };

export function computeSwarmAggregateScores(proposals: SwarmProposal[]): SwarmAggregateScores {
  if (proposals.length === 0) {
    return {
      swarmConfidence: 0.5,
      swarmPriority: 0.5,
      swarmRisk: 0.5,
      swarmReadiness: 0.5,
      agreementScore: 0.5,
      evidenceScore: 0.5,
      executionSuitability: 0.5,
    };
  }

  const n = proposals.length;
  const sum = (fn: (p: SwarmProposal) => number) => proposals.reduce((s, p) => s + fn(p), 0) / n;

  const swarmConfidence = sum((p) => p.confidence);
  const swarmPriority = sum((p) => p.priority);
  const swarmRisk = sum((p) => p.risk);
  const evidenceScore = sum((p) => p.evidenceQuality);
  const swarmReadiness = Math.max(0, Math.min(1, 1 - swarmRisk * 0.6 + evidenceScore * 0.4));

  const variance =
    proposals.reduce((s, p) => s + (p.confidence - swarmConfidence) ** 2, 0) / Math.max(n, 1);
  const agreementScore = Math.max(0, Math.min(1, 1 - Math.min(variance * 4, 1)));

  const executionSuitability = Math.max(
    0,
    Math.min(1, W.confidence * swarmConfidence + W.priority * swarmPriority + W.evidence * evidenceScore - W.risk * swarmRisk),
  );

  return {
    swarmConfidence,
    swarmPriority,
    swarmRisk,
    swarmReadiness,
    agreementScore,
    evidenceScore,
    executionSuitability,
  };
}
