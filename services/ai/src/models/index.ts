/**
 * AI Service – shared types and response shapes.
 */

export type ListingAnalysisInput = {
  title: string;
  description?: string;
  amenities?: string[];
  location?: { city?: string; address?: string };
  photos?: string[]; // URLs or count
};

export type ListingAnalysisRecommendation = {
  type: "title" | "description" | "amenities" | "photos" | "location";
  priority: "high" | "medium" | "low";
  title: string;
  suggestion: string;
};

export type ListingAnalysisOutput = {
  recommendations: ListingAnalysisRecommendation[];
  overallScore: number; // 0–100
  summary: string;
};

export type PricingInput = {
  location: string; // city or region
  propertyType?: string;
  season?: string;
  demandLevel?: "low" | "medium" | "high";
  listingRating?: number;
  nearbyListingPrices?: number[]; // cents
};

export type PricingOutput = {
  recommendedNightlyCents: number;
  suggestedMinCents: number;
  suggestedMaxCents: number;
  confidenceLevel: "low" | "medium" | "high";
  factors: string[];
};

export type DemandInput = {
  region: string; // city or market code
  propertyType?: string;
  fromDate?: string; // ISO date
  toDate?: string;
};

export type DemandOutput = {
  demandLevel: "low" | "medium" | "high";
  highDemandDates: string[]; // ISO dates
  lowDemandDates: string[];
  searchVolumeTrend?: "up" | "down" | "stable";
  bookingFrequencyTrend?: "up" | "down" | "stable";
};

export type FraudCheckInput = {
  bookingId?: string;
  userId?: string;
  signals?: { type: string; score: number }[];
};

export type FraudCheckOutput = {
  riskScore: number; // 0–1
  recommendedAction: "allow" | "review" | "block";
  factors: string[];
  priority: "low" | "medium" | "high";
};

export type SupportInput = {
  type: "host_question" | "guest_question" | "dispute_summary" | "suggest_response";
  message?: string;
  conversation?: { role: "user" | "agent"; content: string }[];
  disputeId?: string;
  context?: Record<string, unknown>;
};

export type SupportOutput = {
  answer?: string;
  summary?: string;
  suggestedResponse?: string;
  suggestedTags?: string[];
  urgency?: "low" | "medium" | "high" | "critical";
}
