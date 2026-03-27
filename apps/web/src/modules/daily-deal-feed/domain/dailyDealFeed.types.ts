export type FeedBucket =
  | "top_opportunities"
  | "hidden_gems"
  | "needs_review"
  | "risky_watchouts"
  | "bnhub_candidates";

export type InteractionType =
  | "viewed"
  | "saved"
  | "ignored"
  | "analyzed"
  | "contacted"
  | "clicked"
  | "dismissed";

export type StrategyMode = "balanced" | "cashflow" | "appreciation" | "flip";
export type RiskTolerance = "low" | "medium" | "high";

export type FeedPreferences = {
  userId: string;
  preferredCities: string[];
  preferredPropertyTypes: string[];
  preferredModes: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  strategyMode: StrategyMode | null;
  riskTolerance: RiskTolerance | null;
};

export type FeedInteractionSignal = {
  listingId: string;
  interactionType: InteractionType;
  createdAt: Date;
};

export type DailyDealCandidate = {
  listingId: string;
  title: string;
  city: string;
  propertyType: string | null;
  listingMode: string | null;
  priceCents: number;
  imageUrl: string | null;
  dealScore: number;
  trustScore: number;
  riskScore: number;
  confidence: number;
  freshnessDays: number;
  updatedAt: Date;
};

export type RankingBreakdown = {
  deal: number;
  trust: number;
  personalization: number;
  freshness: number;
  confidence: number;
  engagement: number;
  penalties: number;
};

export type RankedDailyDealItem = DailyDealCandidate & {
  score: number;
  bucket: FeedBucket;
  rankPosition: number;
  breakdown: RankingBreakdown;
  explanation: {
    headline: string;
    detail: string;
    confidenceNote: string;
  };
  badges: string[];
  isNewToUser: boolean;
};

export type DailyDealFeed = {
  generatedForDate: string;
  feedType: "user" | "workspace" | "general";
  itemCount: number;
  hero: RankedDailyDealItem | null;
  sections: Array<{ bucket: FeedBucket; label: string; items: RankedDailyDealItem[] }>;
  retentionHooks: string[];
};
