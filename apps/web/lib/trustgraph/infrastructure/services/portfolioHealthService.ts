import type { PortfolioTrustAnalyticsDto } from "@/lib/trustgraph/domain/portfolio";

export function emptyPortfolioAnalytics(): PortfolioTrustAnalyticsDto {
  return {
    totalListings: 0,
    verifiedHighTrustPercent: null,
    incompleteDeclarationsPercent: null,
    criticalUnresolvedPercent: null,
    premiumEligiblePercent: null,
    brokerVerifiedRatePercent: null,
    mortgageReadinessDistribution: [],
    avgHoursToVerification: null,
    slaBreachRatePercent: null,
  };
}
