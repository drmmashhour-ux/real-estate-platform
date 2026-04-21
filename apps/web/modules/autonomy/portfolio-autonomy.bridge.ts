import type { BuildCandidatesInput } from "@/modules/autonomy/autonomy.types";

/**
 * Portfolio intelligence → autonomy hints. Soft suggestions only; explainable fields.
 * Extend with real portfolio metrics when wired.
 */
export function mergePortfolioIntelligenceForAutonomy(input: BuildCandidatesInput): BuildCandidatesInput {
  const portfolioHints = [...(input.portfolioHints ?? [])];
  if (input.brokerId && portfolioHints.length === 0) {
    portfolioHints.push({
      explain: "baseline_portfolio_signal",
      brokerId: input.brokerId,
      brokerLoad: 0.5,
    });
  }
  return { ...input, portfolioHints };
}
