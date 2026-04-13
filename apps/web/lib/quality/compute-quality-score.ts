import type { ListingHealthStatus, ListingQualityLevel, Prisma } from "@prisma/client";
import { computeBehaviorScoreComponent } from "@/lib/quality/compute-behavior-score";
import { computeContentScoreComponent } from "@/lib/quality/compute-content-score";
import { computePerformanceScoreComponent } from "@/lib/quality/compute-performance-score";
import { computePricingScoreComponent } from "@/lib/quality/compute-pricing-score";
import { computeTrustScoreComponent } from "@/lib/quality/compute-trust-score";
import { healthStatusFromComponents, qualityLevelFromScore, clampInt } from "@/lib/quality/validators";

const W = {
  content: 0.28,
  pricing: 0.18,
  performance: 0.22,
  behavior: 0.17,
  trust: 0.15,
} as const;

export type ListingQualityComputeResult = {
  qualityScore: number;
  level: ListingQualityLevel;
  healthStatus: ListingHealthStatus;
  contentScore: number;
  pricingScore: number;
  performanceScore: number;
  behaviorScore: number;
  trustScore: number;
  reasonsJson: Prisma.InputJsonValue;
};

export async function computeListingQualityFull(listingId: string): Promise<ListingQualityComputeResult> {
  const [content, pricing, performance, behavior, trust] = await Promise.all([
    computeContentScoreComponent(listingId),
    computePricingScoreComponent(listingId),
    computePerformanceScoreComponent(listingId),
    computeBehaviorScoreComponent(listingId),
    computeTrustScoreComponent(listingId),
  ]);

  const composite =
    content.score * W.content +
    pricing.score * W.pricing +
    performance.score * W.performance +
    behavior.score * W.behavior +
    trust.score * W.trust;

  const qualityScore = clampInt(composite, 0, 100);
  const level = qualityLevelFromScore(qualityScore);
  const healthStatus = healthStatusFromComponents(
    qualityScore,
    level,
    performance.score,
    behavior.score
  );

  return {
    qualityScore,
    level,
    healthStatus,
    contentScore: clampInt(content.score, 0, 100),
    pricingScore: clampInt(pricing.score, 0, 100),
    performanceScore: clampInt(performance.score, 0, 100),
    behaviorScore: clampInt(behavior.score, 0, 100),
    trustScore: clampInt(trust.score, 0, 100),
    reasonsJson: {
      weights: W,
      components: {
        content: content.detail,
        pricing: pricing.detail,
        performance: performance.detail,
        behavior: behavior.detail,
        trust: trust.detail,
      },
      engine: "listing_quality_aggregate_v1",
    } as Prisma.InputJsonValue,
  };
}
