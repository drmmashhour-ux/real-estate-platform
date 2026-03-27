import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { isDealAnalyzerRepricingTriggersEnabled } from "@/modules/deal-analyzer/config";
import { evaluateRepricingTriggersForListing } from "@/modules/deal-analyzer/infrastructure/services/repricingTriggerService";
import { logDealAnalyzerPhase4 } from "@/modules/deal-analyzer/infrastructure/services/phase4Logger";

export async function runSellerRepricingReview(listingId: string) {
  if (!isDealAnalyzerRepricingTriggersEnabled()) {
    return { ok: false as const, error: "Repricing triggers disabled" };
  }

  const trig = await evaluateRepricingTriggersForListing(listingId);

  const listing = await prisma.fsboListing.findUnique({ where: { id: listingId } });
  const advice = await prisma.sellerPricingAdvice.findUnique({ where: { propertyId: listingId } });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  const reasons: string[] = [];
  if (advice?.reasons && Array.isArray(advice.reasons)) {
    for (const r of advice.reasons) {
      if (typeof r === "string") reasons.push(r);
    }
  }
  reasons.push(dealAnalyzerConfig.phase4.disclaimers.repricing);

  const row = await prisma.sellerRepricingReview.upsert({
    where: { propertyId: listingId },
    create: {
      propertyId: listingId,
      currentPriceCents: listing.priceCents,
      currentPosition: advice?.pricePosition ?? "unknown",
      suggestedAction: advice?.suggestedAction ?? "gather_more_market_evidence",
      confidenceLevel: advice?.confidenceLevel ?? "low",
      reasons: reasons as unknown as Prisma.InputJsonValue,
      explanation: advice?.explanation ?? null,
    },
    update: {
      currentPriceCents: listing.priceCents,
      currentPosition: advice?.pricePosition ?? "unknown",
      suggestedAction: advice?.suggestedAction ?? "gather_more_market_evidence",
      confidenceLevel: advice?.confidenceLevel ?? "low",
      reasons: reasons as unknown as Prisma.InputJsonValue,
      explanation: advice?.explanation ?? null,
    },
  });

  logDealAnalyzerPhase4("seller_repricing_review", {
    propertyId: listingId,
    triggersEvaluated: String(trig.created),
    confidence: row.confidenceLevel,
  });

  return { ok: true as const, reviewId: row.id, triggersCreated: trig.created };
}
