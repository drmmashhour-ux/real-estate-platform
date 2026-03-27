import { summarizePortfolioBuckets } from "@/modules/deal-analyzer/infrastructure/services/portfolioOpportunityService";
import { rankInvestorPortfolio } from "@/modules/deal-analyzer/application/rankInvestorPortfolio";

export async function getPortfolioOpportunitySummary(args: { listingIds: string[]; filters?: string[] }) {
  const out = await rankInvestorPortfolio(args);
  if (!out.ok) return out;
  const buckets = summarizePortfolioBuckets(out.ranked);
  return {
    ok: true as const,
    buckets,
    total: out.ranked.length,
    ranked: out.ranked,
  };
}
