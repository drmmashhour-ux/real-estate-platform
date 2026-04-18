import { marketplaceIntelligenceFlags } from "@/config/feature-flags";
import { getLatestListingRanking } from "./marketplace-intelligence.repository";

export type RankingWeightResult = {
  listingId: string;
  /** 0..1 weight hint — metadata only; does not reorder live search by itself. */
  weight: number;
  experimentalRankingEnabled: boolean;
  explain: string;
};

/**
 * Safe metadata for future search / featured blocks — never silently overrides global ordering.
 */
export async function getListingRankingWeight(listingId: string): Promise<RankingWeightResult> {
  const experimental = marketplaceIntelligenceFlags.marketplaceRankingSignalsV1;
  if (!experimental || !marketplaceIntelligenceFlags.marketplaceIntelligenceV1) {
    return {
      listingId,
      weight: 0.5,
      experimentalRankingEnabled: false,
      explain: "Marketplace ranking signals disabled or base intelligence flag off — neutral weight.",
    };
  }

  const latest = await getLatestListingRanking(listingId);
  if (!latest) {
    return {
      listingId,
      weight: 0.5,
      experimentalRankingEnabled: true,
      explain: "No persisted ranking snapshot yet — neutral weight.",
    };
  }

  const w = Math.max(0, Math.min(1, latest.score / 100));
  return {
    listingId,
    weight: Number(w.toFixed(4)),
    experimentalRankingEnabled: true,
    explain: `Latest V6 ranking score ${latest.score} (confidence ${latest.confidence.toFixed(2)}).`,
  };
}

export async function getMarketplaceBoostEligibility(listingId: string): Promise<{
  eligible: boolean;
  reason: string;
}> {
  if (!marketplaceIntelligenceFlags.marketplaceIntelligenceV1 || !marketplaceIntelligenceFlags.marketplaceRankingSignalsV1) {
    return { eligible: false, reason: "Feature gated — boost metadata not evaluated." };
  }
  const latest = await getLatestListingRanking(listingId);
  if (!latest) return { eligible: false, reason: "No ranking snapshot." };
  if (latest.score >= 75) {
    return { eligible: true, reason: "Ranking score meets boost candidate threshold (advisory only)." };
  }
  return { eligible: false, reason: "Ranking score below boost threshold." };
}

export async function getMarketplaceDownrankEligibility(listingId: string): Promise<{
  eligible: boolean;
  reason: string;
}> {
  if (!marketplaceIntelligenceFlags.marketplaceIntelligenceV1 || !marketplaceIntelligenceFlags.marketplaceRankingSignalsV1) {
    return { eligible: false, reason: "Feature gated — downrank metadata not evaluated." };
  }
  const latest = await getLatestListingRanking(listingId);
  if (!latest) return { eligible: false, reason: "No ranking snapshot." };
  if (latest.score < 45) {
    return { eligible: true, reason: "Ranking score suggests weak placement (advisory only; no global override)." };
  }
  return { eligible: false, reason: "Ranking score above downrank advisory threshold." };
}
