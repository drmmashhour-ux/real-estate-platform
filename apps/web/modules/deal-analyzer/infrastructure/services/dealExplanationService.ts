import type { DealAnalysisResult } from "@/modules/deal-analyzer/domain/types";

export function buildExplanationText(result: DealAnalysisResult): string {
  const lines = [
    `Investment score ${result.investmentScore}/100 is a weighted blend of trust, pricing, readiness, and market signals (and income when applicable).`,
    `Risk score ${result.riskScore}/100 is higher when documentation, pricing, or trust signals are weaker.`,
    `Recommendation: ${result.recommendation}. Opportunity label: ${result.opportunityType}.`,
  ];
  return lines.join(" ");
}
