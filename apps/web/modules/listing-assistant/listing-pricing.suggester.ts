import type { LecipmListingAssetType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clamp, round2 } from "@/modules/investment/recommendation-math";
import type {
  PricingConfidenceLevel,
  PricingSuggestionResult,
} from "@/modules/listing-assistant/listing-assistant.types";

/**
 * Peer-based price band vs CRM listings of same asset type — heuristic only.
 */
export async function suggestPricingRange(params: {
  listingType: string;
  currentPriceMajor?: number | null;
}): Promise<PricingSuggestionResult> {
  const listingType = params.listingType as LecipmListingAssetType;
  const wherePeers = {
    listingType,
    price: { gt: 0 },
  };
  const [peers, count] = await Promise.all([
    prisma.listing.aggregate({
      where: wherePeers,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.listing.count({ where: wherePeers }),
  ]);

  const avg = peers._avg.price ?? 0;
  const minP = peers._min.price ?? avg * 0.85;
  const maxP = peers._max.price ?? avg * 1.15;

  let suggestedMinMajor = Math.max(1, round2(minP * 0.95));
  let suggestedMaxMajor = Math.max(suggestedMinMajor + 1, round2(maxP * 1.05));

  const thinBand = avg <= 0 || count < 3;
  const confidenceLevel: PricingConfidenceLevel =
    count >= 12 ? "HIGH"
    : count >= 6 ? "MEDIUM"
    : "LOW";

  const base = (rationale: string): PricingSuggestionResult => ({
    suggestedMinMajor,
    suggestedMaxMajor,
    priceBandLow: suggestedMinMajor,
    priceBandHigh: suggestedMaxMajor,
    comparableCount: count,
    confidenceLevel,
    thinDataWarning: thinBand,
    competitivenessScore: 50,
    rationale,
  });

  if (thinBand) {
    suggestedMinMajor = params.currentPriceMajor ? round2(params.currentPriceMajor * 0.94) : 100_000;
    suggestedMaxMajor = params.currentPriceMajor ? round2(params.currentPriceMajor * 1.06) : 900_000;
    return base(
      count < 3 ?
        "Insufficient peer CRM listings for this type — market-wide heuristic band only; use comps manually."
      : "Limited pricing history — verify with MLS-style comps."
    );
  }

  const current = params.currentPriceMajor ?? avg;
  const ratio = avg > 0 ? current / avg : 1;
  const competitivenessScore = clamp(round2(100 - Math.abs(1 - ratio) * 120), 15, 95);

  suggestedMinMajor = round2(avg * 0.92);
  suggestedMaxMajor = round2(avg * 1.08);

  return {
    suggestedMinMajor,
    suggestedMaxMajor,
    priceBandLow: suggestedMinMajor,
    priceBandHigh: suggestedMaxMajor,
    comparableCount: count,
    confidenceLevel,
    thinDataWarning: false,
    competitivenessScore,
    rationale: `Compared to ${count} CRM listings of type ${params.listingType}; peer avg ~$${round2(avg).toLocaleString()} — illustrative only.`,
  };
}
