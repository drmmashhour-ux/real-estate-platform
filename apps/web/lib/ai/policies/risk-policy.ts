/**
 * Risk tiers for monitoring / trust agent (heuristic, not a substitute for human review).
 */

export type RiskTier = "low" | "medium" | "high";

export function tierFromConfidence(confidence: number, requiresApproval: boolean): RiskTier {
  if (requiresApproval) return "high";
  if (confidence < 0.45) return "medium";
  return "low";
}
