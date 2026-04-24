import type { EnrichedCandidate, RankingResult } from "./scenario-autopilot.types";

export function buildApprovalExplanation(best: EnrichedCandidate, ranking: RankingResult): string {
  return [
    `Selected "${best.title}" in domain ${best.domain}.`,
    ranking.reasonBestWon,
    `Simulation confidence: ${best.simulation.confidenceLevel}. Key warnings: ${best.simulation.riskWarnings.slice(0, 2).join(" · ") || "none flagged."}`,
  ].join(" ");
}

export function buildWhyApprovalRequired(c: EnrichedCandidate): string {
  if (c.requiresHighTierApproval || c.riskLevel === "high" || c.riskLevel === "critical") {
    return "This scenario touches pricing, visibility, or trust-adjacent controls — human approval and audit are required before any production execution.";
  }
  return "Standard governance: all autopilot scenarios require explicit approver attestation, even for lower-risk timing experiments.";
}

export function buildSuccessMetricPreview(c: EnrichedCandidate): string {
  return `Success: modeled revenue ${c.normalized.revenueDelta.toFixed(1)}% with conversion +${c.normalized.conversionDelta.toFixed(1)} pts, dispute risk +${c.normalized.disputeRiskDelta.toFixed(1)} pts (monitor in Command Center 7d window).`;
}
