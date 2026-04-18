import { prisma } from "@/lib/db";
import { revenueV4Flags } from "@/config/feature-flags";
import { loadFsboPricingSignals, type FsboPricingSignals } from "./pricing.signals";
import { optimizeFsboListPrice } from "./pricing.optimizer";
import type { PricingRecommendation } from "./pricing.model";
import { logRevenueEngineV4Event } from "@/src/modules/revenue/revenue.logger";
import { calculatePriceCompetitiveness } from "./pricing.competitiveness";

export { calculatePriceCompetitiveness };

export { recommendPriceV2 } from "./pricing-v2.engine";
export type { RecommendPriceV2Result, RecommendPriceV2Input } from "./pricing-v2.types";

export async function recommendFsboListingPrice(listingId: string): Promise<PricingRecommendation | null> {
  if (!revenueV4Flags.pricingEngineV1) return null;

  const signals = await loadFsboPricingSignals(listingId);
  if (!signals) return null;

  const rec = optimizeFsboListPrice(signals);

  await logRevenueEngineV4Event({
    engine: "pricing",
    action: "recommend_fsbo_list_price",
    entityType: "fsbo_listing",
    entityId: listingId,
    inputJson: { city: signals.city, peerSampleSize: signals.peerSampleSize },
    outputJson: rec as unknown as Record<string, unknown>,
    confidence: rec.confidence * 100,
    explanation: rec.reasoning.join(" | "),
  });

  return rec;
}

/** Spec alias — same as {@link recommendFsboListingPrice} (never auto-applies). */
export const generatePricingSuggestion = recommendFsboListingPrice;

/**
 * Heuristic recommendation from persisted listing + internal peers (see `loadFsboPricingSignals`).
 * Does not fabricate external market statistics.
 */
export async function recommendPrice(
  listing: { id: string } | FsboPricingSignals,
  marketData?: null,
): Promise<PricingRecommendation | null> {
  void marketData;
  const id = "id" in listing ? listing.id : listing.listingId;
  return recommendFsboListingPrice(id);
}

/**
 * Batch recompute for cron / internal jobs — logs each row; does not write list prices to listings.
 */
export async function recalculatePricingBatch(opts?: {
  limit?: number;
  listingIds?: string[];
}): Promise<{ processed: number; skipped: number; errors: string[] }> {
  if (!revenueV4Flags.pricingEngineV1) {
    return { processed: 0, skipped: 0, errors: ["FEATURE_PRICING_ENGINE_V1 disabled"] };
  }
  const limit = Math.min(500, Math.max(1, opts?.limit ?? 50));
  const errors: string[] = [];
  let processed = 0;

  const rows =
    opts?.listingIds?.length ?
      await prisma.fsboListing.findMany({
        where: { id: { in: opts.listingIds.slice(0, limit) } },
        select: { id: true },
      })
    : await prisma.fsboListing.findMany({
        where: { status: "ACTIVE", moderationStatus: "APPROVED" },
        select: { id: true },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

  for (const row of rows) {
    try {
      const rec = await recommendFsboListingPrice(row.id);
      if (rec) processed += 1;
    } catch (e) {
      errors.push(`${row.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed, skipped: rows.length - processed, errors };
}

/** Persist latest heuristic to `SellerPricingAdvice` for dashboards (not an appraisal; not auto-applied). */
export async function persistFsboPricingAdviceSnapshot(
  listingId: string,
  existing?: PricingRecommendation | null,
): Promise<void> {
  if (!revenueV4Flags.pricingEngineV1) return;
  const rec = existing ?? (await recommendFsboListingPrice(listingId));
  if (!rec) return;

  await prisma.sellerPricingAdvice.upsert({
    where: { propertyId: listingId },
    create: {
      propertyId: listingId,
      pricePosition: rec.strategy,
      confidenceLevel: rec.confidenceLabel,
      suggestedAction: `Review suggested list near ${(rec.recommendedPriceCents / 100).toLocaleString("en-CA")} CAD — confirm before publishing changes.`,
      reasons: rec.reasoning,
      improvementActions: [],
      explanation: rec.dataQualityNote ?? rec.expectedImpact,
    },
    update: {
      pricePosition: rec.strategy,
      confidenceLevel: rec.confidenceLabel,
      suggestedAction: `Review suggested list near ${(rec.recommendedPriceCents / 100).toLocaleString("en-CA")} CAD — confirm before publishing changes.`,
      reasons: rec.reasoning,
      explanation: rec.dataQualityNote ?? rec.expectedImpact,
    },
  });
}
