import { clamp, round2 } from "@/modules/investment/recommendation-math";
import type { UnderwritingResult } from "@/modules/investment/underwriting.types";

export type InvestmentStance = "buy" | "caution" | "reject";

export function classifyInvestment(result: UnderwritingResult): { score: number; recommendation: InvestmentStance } {
  let score = 50;

  if (result.roi >= 0.12) score += 20;
  else if (result.roi < 0.05) score -= 20;

  if (result.cashFlowMonthly > 0) score += 10;
  else score -= 15;

  if (result.breakEvenOccupancy < 0.6) score += 10;
  else score -= 10;

  if (result.capRate >= 0.08) score += 10;

  score = clamp(round2(score), 0, 100);

  let recommendation: InvestmentStance = "caution";

  if (score >= 75) recommendation = "buy";
  else if (score < 40) recommendation = "reject";

  return { score, recommendation };
}
