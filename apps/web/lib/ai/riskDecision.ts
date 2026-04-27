export type RiskDecision = "block" | "review" | "allow";

export function riskDecision(score: number): RiskDecision {
  if (score >= 70) return "block";
  if (score >= 40) return "review";
  return "allow";
}
