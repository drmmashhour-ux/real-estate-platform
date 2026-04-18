export type ListingQualityScore = {
  listingId: string;
  score: number; // 0..100
  confidence: number; // 0..1
  factors: string[];
  warnings: string[];
  createdAt: string;
};

export type ListingTrustScore = {
  listingId: string;
  score: number; // 0..100
  confidence: number; // 0..1
  factors: string[];
  riskFlags: string[];
  createdAt: string;
};

export type FraudSignalType =
  | "DUPLICATE_LISTING"
  | "SUSPICIOUS_PRICE"
  | "SUSPICIOUS_REVIEW_PATTERN"
  | "HOST_IDENTITY_GAP"
  | "IMAGE_REUSE"
  | "UNUSUAL_MESSAGE_PATTERN"
  | "BOOKING_PATTERN_ANOMALY"
  | "PROFILE_INCONSISTENCY"
  | "LISTING_CONTENT_RISK";

export type FraudSignal = {
  listingId?: string | null;
  userId?: string | null;
  signalType: FraudSignalType;
  severity: "LOW" | "MEDIUM" | "HIGH";
  confidence: number; // 0..1
  reason: string;
  evidence: Record<string, unknown>;
  createdAt: string;
};

export type MarketplaceRankingScore = {
  listingId: string;
  score: number;
  confidence: number;
  components: {
    quality: number;
    trust: number;
    conversion: number;
    priceFit: number;
    freshness: number;
  };
  reasons: string[];
  createdAt: string;
};

export type PricingRecommendation = {
  listingId: string;
  currentPrice: number;
  recommendedPrice: number;
  adjustmentPercent: number;
  confidence: number;
  reason: string;
  evidence: Record<string, unknown>;
  createdAt: string;
};

export type MarketplaceDecisionType =
  | "BOOST_LISTING"
  | "DOWNRANK_LISTING"
  | "REVIEW_LISTING"
  | "RECOMMEND_PRICE_CHANGE"
  | "FLAG_FOR_FRAUD_REVIEW"
  | "QUALITY_IMPROVEMENT_RECOMMENDED";

export type MarketplaceDecision = {
  id: string;
  listingId?: string | null;
  userId?: string | null;
  type: MarketplaceDecisionType;
  confidence: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  evidence: Record<string, unknown>;
  createdAt: string;
};
