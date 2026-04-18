export type SeoPageFamily =
  | "city_property_transaction"
  | "neighborhood_property"
  | "city_budget_bucket"
  | "city_bedrooms"
  | "bnhub_city_destination"
  | "investment_city"
  | "broker_directory_city";

export type SeoScoreComponents = {
  inventoryStrengthScore: number;
  uniquenessScore: number;
  freshnessScore: number;
  contentSupportScore: number;
  businessValueScore: number;
  internalLinkingScore: number;
  overallSeoOpportunityScore: number;
};

export type GrowthV2ScanSummary = {
  seoCandidatesUpserted: number;
  seoDraftsGenerated: number;
  socialCandidates: number;
  campaignCandidates: number;
  /** Pending high-suspicion referral rows surfaced for review */
  referralAbuseCases: number;
};
