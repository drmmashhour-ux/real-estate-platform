/**
 * Darlink AI — shared domain types (Syria-only product).
 * All surfaced outputs are explainable; no hidden black-box semantics.
 */

export type AiTargetKind =
  | "listing"
  | "stay"
  | "area"
  | "city"
  | "campaign"
  | "user"
  | "admin_dashboard";

export type AiInsightKind =
  | "listing_quality"
  | "pricing"
  | "investment"
  | "location"
  | "ranking"
  | "growth"
  | "map_hotzone"
  | "recommendation"
  | "copy_assist";

export type RiskLevel = "low" | "medium" | "high";

export type ConfidenceBand = "low" | "medium" | "high";

export type PriceMarketPosition = "below_market" | "within_market" | "above_market" | "unknown";

export type AutonomyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT";

export type RecommendationDisposition = "pending" | "applied" | "dismissed" | "acknowledged";

export type EvidenceItem = {
  label: string;
  value: string | number | boolean | null;
  /** Optional machine hint for admins — not shown to end users verbatim if sensitive. */
  detail?: string;
};

export type AiInsightBase = {
  id: string;
  kind: AiInsightKind;
  targetKind: AiTargetKind;
  targetId: string;
  createdAt: string;
  explanation: string;
  confidence: number;
  confidenceBand: ConfidenceBand;
  evidence: EvidenceItem[];
  /** Human-readable safe fallback when confidence is low. */
  safeFallback: string;
  recommendedAction?: RecommendationAction;
};

export type RecommendationActionType =
  | "REQUEST_PRICE_REVIEW"
  | "REQUEST_DESCRIPTION_IMPROVEMENT"
  | "REQUEST_PHOTO_IMPROVEMENT"
  | "SUGGEST_FEATURED_UPGRADE"
  | "SUGGEST_REFRESH"
  | "CREATE_INTERNAL_REVIEW_TASK";

export type RecommendationAction = {
  type: RecommendationActionType;
  labelAr: string;
  labelEn: string;
  riskLevel: RiskLevel;
};

export type ListingQualityReport = {
  id: string;
  targetId: string;
  completenessScore: number;
  contentScore: number;
  mediaScore: number;
  trustScore: number;
  issues: { code: string; severity: RiskLevel; messageAr: string; messageEn: string }[];
  suggestions: { code: string; messageAr: string; messageEn: string }[];
};

export type PricingInsight = AiInsightBase & {
  kind: "pricing";
  suggestedPrice: number | null;
  minRecommended: number | null;
  maxRecommended: number | null;
  pricePosition: PriceMarketPosition;
  peerSampleSize: number;
};

export type PricingSuggestion = {
  listingId: string;
  currency: string;
  suggestedPrice: number | null;
  minRecommended: number | null;
  maxRecommended: number | null;
  pricePosition: PriceMarketPosition;
  confidence: number;
  explanation: string;
  evidence: EvidenceItem[];
};

export type InvestmentInsight = AiInsightBase & {
  kind: "investment";
  investmentScore: number;
  opportunityLabelAr: string;
  opportunityLabelEn: string;
};

export type LocationInsight = AiInsightBase & {
  kind: "location";
  locationScore: number;
};

export type RankingSignal = {
  key: string;
  weight: number;
  contribution: number;
  note: string;
};

export type RankingScore = {
  listingId: string;
  total: number;
  signals: RankingSignal[];
  summary: string;
};

export type GrowthInsight = AiInsightBase & {
  kind: "growth";
  metric: string;
};

/** Alias for cross-cutting insight union */
export type AiInsight =
  | PricingInsight
  | InvestmentInsight
  | LocationInsight
  | GrowthInsight
  | (AiInsightBase & { kind: Exclude<AiInsightKind, "pricing" | "investment" | "location" | "growth"> });

export function confidenceToBand(c: number): ConfidenceBand {
  if (c >= 0.66) return "high";
  if (c >= 0.33) return "medium";
  return "low";
}
