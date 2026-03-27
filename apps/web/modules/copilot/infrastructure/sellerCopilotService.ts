import { prisma } from "@/lib/db";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { getSellerPricingAdvisorDto } from "@/modules/deal-analyzer/application/getSellerPricingAdvisor";
import { isDealAnalyzerEnabled, isDealAnalyzerPricingAdvisorEnabled } from "@/modules/deal-analyzer/config";
import type { CopilotBlock, SellerInsightDto } from "@/modules/copilot/domain/copilotTypes";

export async function runSellerWhyNotSelling(args: {
  listingId: string;
  ownerId: string;
}): Promise<
  { ok: true; block: CopilotBlock; summaryLine: string; usedDealAnalyzer: boolean } | { ok: false; error: string }
> {
  if (!isDealAnalyzerEnabled()) {
    return { ok: false, error: "Deal Analyzer is disabled." };
  }

  const listing = await prisma.fsboListing.findFirst({
    where: { id: args.listingId, ownerId: args.ownerId },
    select: {
      id: true,
      title: true,
      priceCents: true,
      trustScore: true,
      images: true,
      coverImage: true,
      status: true,
      moderationStatus: true,
      updatedAt: true,
    },
  });

  if (!listing) {
    return { ok: false, error: "Listing not found" };
  }

  const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;

  const deal = await getDealAnalysisPublicDto(listing.id);
  const pricing =
    isDealAnalyzerPricingAdvisorEnabled() ? await getSellerPricingAdvisorDto(listing.id) : null;

  const suggestedActions: string[] = [];
  const reasons: string[] = [];

  if (imageCount < 3) {
    suggestedActions.push("Add more high-quality photos (interior + exterior).");
    reasons.push("Weak media reduces buyer confidence on-platform.");
  }
  if (listing.trustScore != null && listing.trustScore < 50) {
    suggestedActions.push("Complete verification and trust-building steps (documents, declarations).");
    reasons.push("Trust/readiness is below typical buyer comfort on this platform.");
  }
  if (listing.moderationStatus !== "APPROVED" || listing.status !== "ACTIVE") {
    suggestedActions.push("Get the listing live and approved for public visibility.");
    reasons.push(`Status: ${listing.status}, moderation: ${listing.moderationStatus}.`);
  }

  if (pricing) {
    reasons.push(...pricing.reasons.slice(0, 5));
    suggestedActions.push(...pricing.improvementActions.slice(0, 5));
    if (pricing.pricePosition.includes("above") || pricing.pricePosition.includes("high")) {
      suggestedActions.push("Review ask vs comparable band in the pricing advisor (not an appraisal).");
    }
  } else {
    reasons.push("Run Deal Analyzer Phase 2 for comparable context when available.");
  }

  if (deal) {
    reasons.push(...deal.reasons.slice(0, 4));
    if (deal.warnings.length) {
      reasons.push(...deal.warnings.slice(0, 3));
    }
  }

  const insights: SellerInsightDto = {
    listingId: listing.id,
    title: listing.title,
    priceCents: listing.priceCents,
    trustScore: listing.trustScore,
    imageCount,
    pricePosition: pricing?.pricePosition ?? null,
    pricingConfidence: pricing?.confidenceLevel ?? null,
    suggestedActions: [...new Set(suggestedActions)].slice(0, 12),
    reasons: [...new Set(reasons)].slice(0, 14),
    dealRecommendation: deal?.recommendation ?? null,
    dealConfidence: deal?.confidenceLevel ?? null,
  };

  const summaryLine =
    "Diagnostics combine listing state, media, trust, and saved Deal Analyzer outputs — not a guarantee of time-on-market.";

  return {
    ok: true,
    block: { type: "seller_insights", insights, queryNote: "Does not change your price automatically." },
    summaryLine,
    usedDealAnalyzer: true,
  };
}
