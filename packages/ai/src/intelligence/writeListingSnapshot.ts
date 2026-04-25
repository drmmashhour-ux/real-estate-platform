import { prisma } from "@/lib/db";
import type { CompositeScoreResult, ListingSignals } from "@/lib/ai/core/types";
import { buildExplanation, buildTrendLabel } from "./buildExplanation";

type WriteArgs = {
  listingId: string;
  signals: ListingSignals;
  composite: CompositeScoreResult;
  suggestedPrice?: number | null;
  priceDeltaPct?: number | null;
  domainSummary?: string;
};

/**
 * Persist unified intelligence row for fast UI + admin (latest row wins for reads).
 */
export async function writeListingIntelligenceSnapshot(args: WriteArgs) {
  const { listingId, signals, composite, suggestedPrice, priceDeltaPct, domainSummary } = args;
  const s = composite.scores;
  const summary =
    domainSummary ?? buildExplanation("autopilot", s, signals) + (composite.trendLabel ? ` (${composite.trendLabel})` : "");

  return prisma.listingIntelligenceSnapshot.create({
    data: {
      listingId,
      relevanceScore: s.relevanceScore,
      demandScore: s.demandScore,
      conversionScore: s.conversionScore,
      priceCompetitiveness: s.priceCompetitiveness,
      qualityScore: s.qualityScore,
      personalizationScore: s.personalizationScore,
      aiCompositeScore: composite.aiCompositeScore,
      confidenceScore: composite.confidenceScore,
      views7d: signals.views7d,
      views30d: signals.views30d,
      bookings7d: signals.bookings7d,
      bookings30d: signals.bookings30d,
      ctr: signals.ctr,
      conversionRate: signals.conversionRate,
      occupancyRate: signals.occupancyRate,
      currentPrice: signals.currentPrice,
      suggestedPrice: suggestedPrice ?? null,
      priceDeltaPct: priceDeltaPct ?? null,
      lowPhotoCount: signals.qualityFlags.lowPhotoCount,
      weakDescription: signals.qualityFlags.weakDescription,
      weakTitle: signals.qualityFlags.weakTitle,
      missingAmenities: signals.qualityFlags.missingAmenities,
      trendLabel: composite.trendLabel ?? buildTrendLabel(signals),
      summary,
    },
  });
}
