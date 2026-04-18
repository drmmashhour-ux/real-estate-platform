import { randomUUID } from "crypto";
import {
  MarketplaceDecision,
  ListingQualityScore,
  ListingTrustScore,
  MarketplaceRankingScore,
  FraudSignal,
  PricingRecommendation,
} from "./marketplace-intelligence.types";

export function buildMarketplaceDecisions(input: {
  quality: ListingQualityScore;
  trust: ListingTrustScore;
  ranking: MarketplaceRankingScore;
  fraudSignals: FraudSignal[];
  pricingRecommendation?: PricingRecommendation | null;
}): MarketplaceDecision[] {
  const out: MarketplaceDecision[] = [];
  const now = new Date().toISOString();

  if (input.fraudSignals.some((s) => s.severity === "HIGH")) {
    out.push({
      id: randomUUID(),
      listingId: input.quality.listingId,
      userId: null,
      type: "FLAG_FOR_FRAUD_REVIEW",
      confidence: 0.9,
      priority: "HIGH",
      reason: "High-severity fraud signal detected. Manual review recommended.",
      evidence: { signals: input.fraudSignals },
      createdAt: now,
    });
  }

  if (input.quality.score < 55) {
    out.push({
      id: randomUUID(),
      listingId: input.quality.listingId,
      userId: null,
      type: "QUALITY_IMPROVEMENT_RECOMMENDED",
      confidence: input.quality.confidence,
      priority: "MEDIUM",
      reason: "Listing quality score is low and likely affecting visibility and conversion.",
      evidence: { warnings: input.quality.warnings },
      createdAt: now,
    });
  }

  if (input.trust.score < 50) {
    out.push({
      id: randomUUID(),
      listingId: input.quality.listingId,
      userId: null,
      type: "REVIEW_LISTING",
      confidence: input.trust.confidence,
      priority: "HIGH",
      reason: "Trust score is weak and should be reviewed before marketplace boosting.",
      evidence: { riskFlags: input.trust.riskFlags },
      createdAt: now,
    });
  }

  if (input.ranking.score >= 75 && input.trust.score >= 60) {
    out.push({
      id: randomUUID(),
      listingId: input.quality.listingId,
      userId: null,
      type: "BOOST_LISTING",
      confidence: input.ranking.confidence,
      priority: "MEDIUM",
      reason: "Listing appears strong enough to deserve more marketplace exposure.",
      evidence: { ranking: input.ranking.components },
      createdAt: now,
    });
  } else if (input.ranking.score < 45) {
    out.push({
      id: randomUUID(),
      listingId: input.quality.listingId,
      userId: null,
      type: "DOWNRANK_LISTING",
      confidence: input.ranking.confidence,
      priority: "LOW",
      reason: "Listing ranking score is weak relative to marketplace quality and trust expectations.",
      evidence: { ranking: input.ranking.components },
      createdAt: now,
    });
  }

  if (input.pricingRecommendation && Math.abs(input.pricingRecommendation.adjustmentPercent) >= 0.05) {
    out.push({
      id: randomUUID(),
      listingId: input.quality.listingId,
      userId: null,
      type: "RECOMMEND_PRICE_CHANGE",
      confidence: input.pricingRecommendation.confidence,
      priority: "MEDIUM",
      reason: input.pricingRecommendation.reason,
      evidence: input.pricingRecommendation.evidence,
      createdAt: now,
    });
  }

  return out;
}
