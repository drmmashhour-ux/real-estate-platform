import type { CampaignPortfolioInput, PortfolioOptimizationSummary } from "./portfolio-optimization.types";
import { scoreCampaignForPortfolio } from "./portfolio-scoring.service";
import { buildBudgetReallocationPlan } from "./budget-reallocation.service";

export function buildPortfolioOptimizationSummary(campaigns: CampaignPortfolioInput[]): PortfolioOptimizationSummary {
  const scored = campaigns.map(scoreCampaignForPortfolio);
  const recommendations = buildBudgetReallocationPlan({ campaigns, scored });

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const reallocatableBudget = recommendations.reduce((sum, r) => sum + r.amount, 0);

  return {
    totalBudget: Number(totalBudget.toFixed(2)),
    reallocatableBudget: Number(reallocatableBudget.toFixed(2)),
    topCampaigns: scored.filter((x) => x.qualityLabel === "TOP" || x.qualityLabel === "GOOD"),
    weakCampaigns: scored.filter((x) => x.qualityLabel === "WEAK"),
    recommendations,
    notes: [
      "Portfolio optimization is recommendation-only — no automatic budget sync in V1.",
      "Reallocation uses profitability, confidence, volume, and trend together.",
      "Apply any changes manually in Meta/Google Ads Manager.",
    ],
  };
}
