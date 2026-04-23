import { searchListings, type ListingSearchParams } from "@/lib/bnhub/listings";
import {
  oneBrainV2Flags,
  oneBrainV3Flags,
  platformCoreFlags,
  reputationEngineFlags,
  rankingV8ShadowFlags,
} from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import { computeBnhubRankingBundle } from "@/modules/bnhub-ranking/ranking-engine.service";
import { schedulePersistSearchRankingSnapshots } from "@/modules/reputation/snapshot-writer.service";
import {
  getAggregatedSourceWeightForListing,
  getAggregatedTrustScoreForListing,
} from "@/modules/platform-core/one-brain.listing-trust";
import { computeBrokerTrustScore } from "@/modules/compliance/insurance/trust-score.service";
import {
  applyAdaptiveSourceRankingMultiplier,
  applyCrossDomainRankingAdjustment,
  computeListingRank,
} from "@/modules/marketplace/ranking-engine.service";
import { applyRankingExperiment } from "@/modules/marketplace/ranking-experiments.service";
import {
  compareRankingV8LiveVsShadow,
  deriveShadowOrderFromShadowRows,
  logRankingV8Comparison,
} from "./ranking-v8-comparison.service";
import { buildRankingV8ShadowDiffRows } from "./ranking-v8-shadow-evaluator.service";
import {
  applyRankingV8Influence,
  logRankingV8Influence,
  type ApplyRankingV8InfluenceOutput,
} from "./ranking-v8-influence.service";
import { scheduleRankingV8ShadowEvaluation } from "./ranking-v8-shadow-observer.service";

export type RankedSearchResult<T> = {
  listings: T[];
  rankedBy: "legacy" | "reputation_bundle_v1";
  scores?: { listingId: string; rankingScore: number | null }[];
};

type ListingRow = Awaited<ReturnType<typeof searchListings>>[number];

const MAX_SHADOW_LISTINGS = 40;

function influenceMetaStripOutput(inf: ApplyRankingV8InfluenceOutput): Omit<ApplyRankingV8InfluenceOutput, "output"> {
  const { output: _out, ...rest } = inf;
  return rest;
}

/**
 * Opt-in ranked search — calls existing `searchListings` then re-sorts by BNHub bundle score.
 * Does not change default `/api/bnhub/listings` behavior.
 */
export async function searchListingsWithOptionalReputationRank(
  params: ListingSearchParams,
): Promise<RankedSearchResult<ListingRow>> {
  const base = await searchListings(params);
  if (!reputationEngineFlags.rankingEngineV1) {
    return { listings: base, rankedBy: "legacy" };
  }

  const scored = await Promise.all(
    base.map(async (l) => {
      const bundle = await computeBnhubRankingBundle(l.id);
      let rankingScore = bundle?.rankingScore ?? null;

      if (platformCoreFlags.platformCoreV1 && bundle) {
        const [oneBrainTrust, brokerTrust] = await Promise.all([
          getAggregatedTrustScoreForListing(l.id),
          computeBrokerTrustScore(l.ownerId),
        ]);
        
        // Combine platform trust with broker insurance trust
        const combinedTrust = (oneBrainTrust * 0.6) + (brokerTrust.trustScore * 0.4);
        
        const base01 = Math.min(1, Math.max(0, (bundle.rankingScore ?? 0) / 100));
        const perf01 = Math.min(1, Math.max(0, (bundle.conversionScore ?? 0) / 100));
        let blended = computeListingRank({
          baseScore: base01,
          trustScore: combinedTrust,
          performanceScore: perf01,
        });
        if (oneBrainV2Flags.oneBrainV2RankingWeightingV1) {
          const avgW = await getAggregatedSourceWeightForListing(l.id);
          blended = applyAdaptiveSourceRankingMultiplier(blended, avgW);
        }
        const exp = applyRankingExperiment({ listingId: l.id, trustScore: oneBrainTrust });
        if ("boost" in exp) blended += exp.boost ?? 0;
        if ("penalty" in exp) blended += exp.penalty ?? 0;
        if (oneBrainV3Flags.oneBrainV3CrossDomainV1) {
          blended = applyCrossDomainRankingAdjustment({ listingId: l.id, blended01: blended });
        }
        rankingScore = Math.round(blended * 100 * 10) / 10;
      }

      return { listing: l, rankingScore };
    }),
  );

  const sorted = [...scored].sort((a, b) => (b.rankingScore ?? 0) - (a.rankingScore ?? 0));

  let finalSorted = sorted;

  if (rankingV8ShadowFlags.rankingV8InfluenceV1 && rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1) {
    try {
      const liveOrderListingIds = sorted.map((s) => s.listing.id);
      const rows = await buildRankingV8ShadowDiffRows({
        scored,
        liveOrderListingIds,
        maxListings: MAX_SHADOW_LISTINGS,
      });
      const rowIds = new Set(rows.map((r) => r.listingId));
      const liveForCompare = liveOrderListingIds.filter((id) => rowIds.has(id));
      const shadowOrder = deriveShadowOrderFromShadowRows(rows);
      const comparison = compareRankingV8LiveVsShadow({
        liveOrderedIds: liveForCompare,
        shadowOrderedIds: shadowOrder,
      });
      logRankingV8Comparison(comparison);

      const inf = applyRankingV8Influence({ liveSorted: sorted, shadowRows: rows, comparison });
      logRankingV8Influence(inf, {
        influenceEnabled: true,
        overlapTop5: comparison.summary.overlapTop5,
        overlapTop10: comparison.summary.overlapTop10,
        avgRankShift: comparison.avgRankShift,
      });
      finalSorted = inf.output;

      scheduleRankingV8ShadowEvaluation({
        params,
        scored,
        sorted,
        precomputedEvaluation: { rows, comparison },
        influenceMeta: influenceMetaStripOutput(inf),
      });
    } catch (e) {
      logWarn("[ranking:v8:influence]", "influence path failed — falling back to live sort", {
        message: e instanceof Error ? e.message : String(e),
      });
      scheduleRankingV8ShadowEvaluation({ params, scored, sorted });
    }
  } else {
    if (rankingV8ShadowFlags.rankingV8InfluenceV1 && !rankingV8ShadowFlags.rankingV8ShadowEvaluatorV1) {
      logInfo("[ranking:v8:influence]", { event: "skipped", reason: "evaluator_disabled" });
    }
    scheduleRankingV8ShadowEvaluation({ params, scored, sorted });
  }

  schedulePersistSearchRankingSnapshots(finalSorted.map((s) => s.listing.id));

  return {
    listings: finalSorted.map((s) => s.listing),
    rankedBy: "reputation_bundle_v1",
    scores: finalSorted.map((s) => ({ listingId: s.listing.id, rankingScore: s.rankingScore })),
  };
}
