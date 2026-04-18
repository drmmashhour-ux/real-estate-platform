/**
 * BNHub stay search: unified 8-factor performance score + 80/20 exploration blend + anti-gaming.
 */

import type { ListingSearchMetrics } from "@prisma/client";
import type { BnhubListingRankingInput, RankingSearchContext, RankingSignalBundle } from "@/src/modules/ranking/types";
import { buildBnhubSignalBundle } from "@/src/modules/ranking/signalEngine";
import {
  applyAntiGamingBnhub,
  computeRankScore,
  mapSignalsToRankComponents,
  type RankScoreComponents,
  UNIFIED_WEIGHTS_WITHOUT_EXPLORATION,
} from "./compute-rank-score";
import { blendPerformanceAndExploration, computeExplorationScore } from "./exploration";
import { applyRevenueRankingBlendBnhub } from "@/src/modules/revenue/revenue.ranking-bridge";

export type BnhubScoreOptions = {
  /** Default 0.2 — 80% performance / 20% exploration */
  explorationMix?: number;
  unifiedWeights?: Record<keyof RankScoreComponents, number>;
};

export function buildBnhubSignals(
  listing: BnhubListingRankingInput,
  ctx: RankingSearchContext
): RankingSignalBundle {
  return buildBnhubSignalBundle(listing, ctx);
}

export function computeBnhubUnifiedPerformanceScore(
  signals: RankingSignalBundle,
  weights = UNIFIED_WEIGHTS_WITHOUT_EXPLORATION
): { performance0to100: number; components: RankScoreComponents } {
  const components = mapSignalsToRankComponents(signals, 0);
  return {
    performance0to100: computeRankScore(components, weights),
    components,
  };
}

export function computeBnhubFinalSearchScore(
  signals: RankingSignalBundle,
  input: BnhubListingRankingInput,
  metrics: ListingSearchMetrics | null,
  opts?: BnhubScoreOptions
): {
  final0to100: number;
  performance0to100: number;
  exploration01: number;
  components: RankScoreComponents;
} {
  const weights = opts?.unifiedWeights ?? UNIFIED_WEIGHTS_WITHOUT_EXPLORATION;
  let components = mapSignalsToRankComponents(signals, 0);
  const views30d = metrics?.views30d ?? 0;
  const ctr = metrics?.ctr ?? null;
  components = applyAntiGamingBnhub(components, {
    nightPriceCents: input.nightPriceCents,
    medianNightPriceCents: input.medianNightPriceCents ?? null,
    views30d,
    ctr,
  });
  const performance0to100 = computeRankScore(components, weights);

  const exploration01 = computeExplorationScore({
    createdAt: input.createdAt,
    views30d,
    qualityScore: signals.quality,
    medianViewsHint: 28,
  });

  const mix = opts?.explorationMix ?? 0.2;
  let final0to100 = blendPerformanceAndExploration(performance0to100, exploration01, mix);
  final0to100 = applyRevenueRankingBlendBnhub(final0to100, input, components);

  return { final0to100, performance0to100, exploration01, components };
}
