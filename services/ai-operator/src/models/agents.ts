/**
 * Shared agent output shape: confidence, recommended action, escalation.
 */
export type AgentOutputBase = {
  confidenceScore: number;
  recommendedAction: string;
  reasonCodes: string[];
  escalateToHuman?: boolean;
};

// ----- Listing Moderation -----
export type ListingModerationInput = {
  listingId?: string;
  title: string;
  description?: string;
  amenities?: string[];
  photoCount?: number;
  houseRules?: string;
  nightPriceCents?: number;
  cleaningFeeCents?: number;
};

export type ListingModerationOutput = AgentOutputBase & {
  listingQualityScore: number;
  moderationStatus: "approve" | "reject" | "manual_review";
  missingInfoAlerts: string[];
  trustFlags: string[];
};

// ----- Pricing -----
export type PricingInput = {
  listingId?: string;
  location: string;
  season?: string;
  demandLevel?: "low" | "medium" | "high";
  nearbyPricesCents?: number[];
  occupancyTrend?: number;
  listingQualityScore?: number;
  reviewCount?: number;
  avgRating?: number;
  currentPriceCents?: number;
};

export type PricingOutput = AgentOutputBase & {
  recommendedNightlyCents: number;
  priceRangeMinCents: number;
  priceRangeMaxCents: number;
  demandLabel: string;
  suggestedMinStayNights?: number;
  specialPricingPeriods?: { start: string; end: string; multiplier: number }[];
};

// ----- Fraud Risk -----
export type FraudRiskInput = {
  bookingId?: string;
  userId?: string;
  signals?: { type: string; score: number }[];
  paymentAttemptCount?: number;
  cancellationRate?: number;
  accountAgeDays?: number;
};

export type FraudRiskOutput = AgentOutputBase & {
  fraudRiskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  autoFlag: boolean;
};

// ----- Booking Integrity -----
export type BookingIntegrityInput = {
  bookingId?: string;
  guestId?: string;
  hostId?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  cancellationHistoryCount?: number;
  overlapAttempts?: number;
};

export type BookingIntegrityOutput = AgentOutputBase & {
  bookingIntegrityScore: number;
  anomalyStatus: "normal" | "suspicious" | "anomaly";
  suggestedAction: "approve" | "hold" | "review";
};

// ----- Demand Forecast -----
export type DemandForecastInput = {
  market: string;
  propertyType?: string;
  fromDate?: string;
  toDate?: string;
  searchVolumeTrend?: "up" | "down" | "stable";
  bookingFrequency?: number;
};

export type DemandForecastOutput = AgentOutputBase & {
  demandLevel: "low" | "medium" | "high";
  highDemandDates: string[];
  lowDemandDates: string[];
  supplyShortageSignals: string[];
  pricingPressureIndicators: string[];
};

// ----- Host Performance -----
export type HostPerformanceInput = {
  hostId: string;
  responseTimeHours?: number;
  avgRating?: number;
  ratingTrend?: "up" | "down" | "stable";
  cancellationRate?: number;
  complaintCount?: number;
  listingCompletenessPct?: number;
  acceptanceRate?: number;
};

export type HostPerformanceOutput = AgentOutputBase & {
  hostQualityScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementRecommendations: string[];
  badgeEligibility: "none" | "rising" | "quality" | "superhost";
};

// ----- Support Triage -----
export type SupportTriageInput = {
  ticketId?: string;
  subject?: string;
  body: string;
  messages?: { role: string; content: string }[];
};

export type SupportTriageOutput = AgentOutputBase & {
  category: string;
  urgencyScore: number;
  suggestedReply?: string;
  escalationTarget?: string;
};

// ----- Marketplace Health -----
export type MarketplaceHealthInput = {
  periodDays?: number;
  bookingsTrend?: "up" | "down" | "stable";
  cancellationsTrend?: "up" | "down" | "stable";
  fraudAlertVolume?: number;
  disputeVolume?: number;
  listingActivationRate?: number;
  supportTicketSpike?: boolean;
  paymentFailureSpike?: boolean;
};

export type MarketplaceHealthOutput = AgentOutputBase & {
  healthScore: number;
  anomalyAlerts: string[];
  operationalRecommendations: string[];
  regionalRiskWarnings: string[];
};
