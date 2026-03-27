export type PortfolioTrustAnalyticsFilter = {
  entityType?: string;
  trustLevel?: string;
  readinessLevel?: string;
  from?: Date;
  to?: Date;
};

export type PortfolioTrustAnalyticsDto = {
  totalListings: number;
  verifiedHighTrustPercent: number | null;
  incompleteDeclarationsPercent: number | null;
  criticalUnresolvedPercent: number | null;
  premiumEligiblePercent: number | null;
  brokerVerifiedRatePercent: number | null;
  mortgageReadinessDistribution: { bucket: string; count: number }[];
  avgHoursToVerification: number | null;
  slaBreachRatePercent: number | null;
};
