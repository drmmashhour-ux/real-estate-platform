import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { computeRecommendedPrice, upsertDynamicPricingProfile } from "@/src/modules/bnhub-growth-engine/services/dynamicPricingService";
import { logRevenueEngineV4Event } from "@/src/modules/revenue/revenue.logger";
import type { PricingRecommendation } from "./pricing.model";

/**
 * Wraps existing BNHub dynamic pricing compute — persists profile + audit; never writes listing.nightPriceCents.
 */
export async function recommendBnhubNightlyPriceV4(listingId: string): Promise<(PricingRecommendation & { minUsd: number; maxUsd: number }) | null> {
  if (!revenueV4Flags.bnhubDynamicPricingV1) return null;

  const r = await computeRecommendedPrice(listingId);
  const recCents = Math.round(Number(r.recommended) * 100);
  const minCents = Math.round(Number(r.minPrice) * 100);
  const maxCents = Math.round(Number(r.maxPrice) * 100);
  const conf = r.confidenceScore / 100;

  const recommendation: PricingRecommendation = {
    recommendedPriceCents: recCents,
    priceRangeCents: { min: minCents, max: maxCents },
    confidence: conf,
    confidenceLabel: conf >= 0.65 ? "medium" : "low",
    reasoning: [
      "Uses existing BNHub dynamic pricing pipeline (demand, seasonality, trust, luxury tier).",
      "Weekend vs weekday split stored on profile — host approval required to change live nightly rate.",
    ],
    expectedImpact:
      "Illustrative revenue effect depends on occupancy response — not projected as guaranteed income.",
    strategy: "occupancy_optimization",
    marketMedian: null,
    marketSampleSize: 0,
    lowConfidence: conf < 0.45,
  };

  await logRevenueEngineV4Event({
    engine: "bnhub_pricing",
    action: "recommend_nightly_price",
    entityType: "short_term_listing",
    entityId: listingId,
    outputJson: { ...recommendation, adjustments: r.adjustments } as unknown as Record<string, unknown>,
    confidence: r.confidenceScore,
    explanation: recommendation.reasoning.join(" "),
  });

  return {
    ...recommendation,
    minUsd: Number(r.minPrice),
    maxUsd: Number(r.maxPrice),
  };
}

/** Nightly batch helper — refreshes `bnhub_dynamic_pricing_profiles` only. */
export async function runBnhubNightlyPricingSuggestionsBatch(limit = 50): Promise<{ processed: number }> {
  if (!revenueV4Flags.bnhubDynamicPricingV1) return { processed: 0 };

  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: "PUBLISHED" },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const l of listings) {
    await upsertDynamicPricingProfile(l.id);
    processed += 1;
  }

  await logRevenueEngineV4Event({
    engine: "bnhub_pricing",
    action: "nightly_batch",
    outputJson: { processed, limit },
    confidence: 100,
    explanation: "Batch refreshed dynamic pricing profiles — no live price apply.",
  });

  return { processed };
}
