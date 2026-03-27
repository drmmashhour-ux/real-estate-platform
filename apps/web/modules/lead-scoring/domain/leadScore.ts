export type LeadScoreCategory = "low" | "medium" | "high";

export type LeadScoreResult = {
  score: number;
  category: LeadScoreCategory;
  reasons: string[];
};

export type LeadScoreSignals = {
  listingCount: number;
  copilotRunCount: number;
  dealAnalysisCount: number;
  verifiedListingCount: number;
  hasActiveWorkspaceSubscription: boolean;
  daysSinceLastActivity: number | null;
};
