import { PortfolioBucket } from "@/modules/deal-analyzer/domain/portfolio";
import type { PortfolioRankedItem } from "@/modules/deal-analyzer/domain/portfolio";

export function summarizePortfolioBuckets(items: PortfolioRankedItem[]): Record<PortfolioBucket, number> {
  const base: Record<PortfolioBucket, number> = {
    [PortfolioBucket.TOP_OPPORTUNITIES]: 0,
    [PortfolioBucket.STABLE_CANDIDATES]: 0,
    [PortfolioBucket.NEEDS_REVIEW]: 0,
    [PortfolioBucket.SPECULATIVE]: 0,
  };
  for (const i of items) {
    base[i.bucket] += 1;
  }
  return base;
}
