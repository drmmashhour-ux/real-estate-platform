export const PortfolioBucket = {
  TOP_OPPORTUNITIES: "top_opportunities",
  STABLE_CANDIDATES: "stable_candidates",
  NEEDS_REVIEW: "needs_review",
  SPECULATIVE: "speculative",
} as const;
export type PortfolioBucket = (typeof PortfolioBucket)[keyof typeof PortfolioBucket];

export const PortfolioFilter = {
  HIGH_TRUST: "high_trust",
  BETTER_CASH_FLOW: "better_cash_flow",
  LOWER_RISK: "lower_risk",
  COMPLETE_DOCS: "complete_docs",
  BNHUB_CANDIDATES: "bnhub_candidates",
} as const;
export type PortfolioFilter = (typeof PortfolioFilter)[keyof typeof PortfolioFilter];

export type PortfolioRankedItem = {
  listingId: string;
  compositeScore: number;
  bucket: PortfolioBucket;
  investmentScore: number;
  riskScore: number;
  reasons: string[];
};
