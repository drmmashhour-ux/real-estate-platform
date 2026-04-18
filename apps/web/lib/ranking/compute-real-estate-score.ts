/**
 * FSBO / marketplace listings: unified score + light exploration for browse.
 */

import type { FsboListingRankingInput, RankingSearchContext, RankingSignalBundle } from "@/src/modules/ranking/types";
import { buildFsboSignalBundle } from "@/src/modules/ranking/signalEngine";
import { clamp01 } from "./normalize-metrics";
import {
  computeRankScore,
  mapSignalsToRankComponents,
  type RankScoreComponents,
  UNIFIED_WEIGHTS_WITHOUT_EXPLORATION,
} from "./compute-rank-score";
import { blendPerformanceAndExploration, computeExplorationScore } from "./exploration";
import { applyRevenueRankingBlendFsbo } from "@/src/modules/revenue/revenue.ranking-bridge";

export function buildRealEstateSignals(
  listing: FsboListingRankingInput,
  ctx: RankingSearchContext
): RankingSignalBundle {
  return buildFsboSignalBundle(listing, ctx);
}

/** Soft anti-gaming: empty listing shell, extreme price vs median */
export function applyAntiGamingRealEstate(
  components: RankScoreComponents,
  listing: FsboListingRankingInput
): RankScoreComponents {
  const out = { ...components };
  const photos = listing.images?.length ?? 0;
  const desc = listing.description?.trim().length ?? 0;
  if (photos < 2 || desc < 40) {
    out.quality_score = clamp01(out.quality_score * 0.85);
    out.trust_score = clamp01(out.trust_score * 0.92);
  }
  const med = listing.medianPriceCents;
  if (med != null && med > 0) {
    const ratio = listing.priceCents / med;
    if (ratio < 0.25 || ratio > 3.5) {
      out.price_score = clamp01(out.price_score * 0.8);
      out.trust_score = clamp01(out.trust_score * 0.9);
    }
  }
  if (listing.viewCount > 120 && listing.leadCount === 0) {
    out.performance_score = clamp01(out.performance_score * 0.9);
  }
  return out;
}

export function computeRealEstateUnifiedPerformanceScore(
  signals: RankingSignalBundle,
  weights = UNIFIED_WEIGHTS_WITHOUT_EXPLORATION
): { performance0to100: number; components: RankScoreComponents } {
  const components = mapSignalsToRankComponents(signals, 0);
  return {
    performance0to100: computeRankScore(components, weights),
    components,
  };
}

export function computeRealEstateFinalBrowseScore(
  signals: RankingSignalBundle,
  listing: FsboListingRankingInput,
  opts?: { explorationMix?: number; unifiedWeights?: Record<keyof RankScoreComponents, number> }
): { final0to100: number; performance0to100: number; exploration01: number; components: RankScoreComponents } {
  let { components } = computeRealEstateUnifiedPerformanceScore(signals, opts?.unifiedWeights);
  components = applyAntiGamingRealEstate(components, listing);
  const performance0to100 = computeRankScore(components, opts?.unifiedWeights ?? UNIFIED_WEIGHTS_WITHOUT_EXPLORATION);

  const exploration01 = computeExplorationScore({
    createdAt: listing.createdAt,
    views30d: listing.viewCount,
    qualityScore: signals.quality,
    medianViewsHint: 80,
  });

  const mix = opts?.explorationMix ?? 0.15;
  let final0to100 = blendPerformanceAndExploration(performance0to100, exploration01, mix);
  final0to100 = applyRevenueRankingBlendFsbo(final0to100, listing, components);

  return { final0to100, performance0to100, exploration01, components };
}
