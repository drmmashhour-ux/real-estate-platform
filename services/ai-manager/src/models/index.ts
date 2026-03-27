/**
 * AI Platform Manager – request/response types.
 */

// ----- Listing Quality -----
export type ListingQualityInput = {
  listingId?: string;
  title: string;
  description?: string;
  amenities?: string[];
  reviews?: { rating: number; text?: string }[];
  photoCount?: number;
  photoUrls?: string[];
};

export type ListingQualityOutput = {
  listingQualityScore: number; // 0-100
  suggestedImprovements: { area: string; priority: "high" | "medium" | "low"; suggestion: string }[];
  summary: string;
};

// ----- Pricing Suggestion -----
export type PricingSuggestionInput = {
  listingId?: string;
  location: string;
  season?: string;
  demandLevel?: "low" | "medium" | "high";
  similarListings?: { nightPriceCents: number }[];
  reviewCount?: number;
  avgRating?: number;
  currentPriceCents?: number;
};

export type PricingSuggestionOutput = {
  recommendedNightlyCents: number;
  priceRangeMinCents: number;
  priceRangeMaxCents: number;
  factors: string[];
  confidence: "low" | "medium" | "high";
};

// ----- Fraud Risk -----
export type RiskCheckInput = {
  bookingId?: string;
  userId?: string;
  signals?: { type: string; score: number }[];
  paymentAttempts?: number;
  accountAgeDays?: number;
};

export type RiskCheckOutput = {
  fraudRiskScore: number; // 0-1
  recommendedAction: "allow" | "review" | "block";
  factors: string[];
  priority: "low" | "medium" | "high";
};

// ----- Demand Forecast -----
export type DemandForecastInput = {
  region: string;
  propertyType?: string;
  fromDate?: string;
  toDate?: string;
  searchVolumeTrend?: "up" | "down" | "stable";
  bookingHistoryCount?: number;
};

export type DemandForecastOutput = {
  highDemandPeriods: { start: string; end: string; level: number }[];
  lowDemandPeriods: { start: string; end: string; level: number }[];
  demandLevel: "low" | "medium" | "high";
  summary: string;
};

// ----- Host Insights -----
export type HostInsightsInput = {
  hostId: string;
  listingIds?: string[];
  periodDays?: number;
};

export type HostInsightsOutput = {
  occupancyTrend: { date: string; occupancyPct: number }[];
  revenueTrend: { date: string; revenueCents: number }[];
  suggestedImprovements: string[];
  priceOptimizationTips: string[];
  summary: string;
};

// ----- Support Assistant -----
export type SupportAssistantInput = {
  action: "summarize_dispute" | "suggest_reply" | "answer_question";
  disputeId?: string;
  messages?: { role: string; content: string }[];
  question?: string;
  context?: Record<string, unknown>;
};

export type SupportAssistantOutput = {
  summary?: string;
  suggestedReply?: string;
  answer?: string;
  suggestedTags?: string[];
  urgency?: "low" | "medium" | "high" | "critical";
};

// ----- Alerts (for dashboard) -----
export type AiAlert = {
  id: string;
  type: "fraud" | "listing_quality" | "pricing" | "demand";
  title: string;
  message: string;
  severity: "low" | "medium" | "high";
  entityType?: string;
  entityId?: string;
  createdAt: string;
};
