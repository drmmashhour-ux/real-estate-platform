/**
 * V8 shadow ranking evaluator — parallel blend only; does not replace `computeListingRank` or live ordering.
 */
import { platformCoreFlags } from "@/config/feature-flags";
import { computeBnhubRankingBundle } from "@/modules/bnhub-ranking/ranking-engine.service";
import { getAggregatedTrustScoreForListing } from "@/modules/platform-core/one-brain.listing-trust";
import type { RankingV8ShadowDiffRow } from "./ranking-v8-shadow.types";

const SHADOW_BASE = 0.38;
const SHADOW_TRUST = 0.32;
const SHADOW_PERF = 0.3;

/**
 * Alternate 0–1 blend (parallel to live `computeListingRank` weights 0.4/0.3/0.3).
 */
export function computeShadowListingRank01(input: {
  baseScore: number;
  trustScore?: number;
  performanceScore?: number;
}): number {
  const trust = input.trustScore ?? 0;
  const performance = input.performanceScore ?? 0;
  const score = input.baseScore * SHADOW_BASE + trust * SHADOW_TRUST + performance * SHADOW_PERF;
  return Number(Math.min(1, Math.max(0, score)).toFixed(4));
}

function finite01(n: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function confidenceFromDelta(delta: number | null): number {
  if (delta == null || !Number.isFinite(delta)) return 0;
  const abs = Math.abs(delta);
  return Number(Math.min(1, Math.max(0, 1 - abs / 45)).toFixed(4));
}

export async function buildRankingV8ShadowDiffRows(input: {
  scored: Array<{ listing: { id: string }; rankingScore: number | null }>;
  liveOrderListingIds: string[];
  maxListings: number;
}): Promise<RankingV8ShadowDiffRow[]> {
  const rankById = new Map(input.liveOrderListingIds.map((id, i) => [id, i]));
  const capped = input.scored.slice(0, input.maxListings);
  const rows: RankingV8ShadowDiffRow[] = [];

  for (const s of capped) {
    const listingId = s.listing.id;
    const liveScore = s.rankingScore;
    const liveRankIndex = rankById.get(listingId) ?? -1;
    const reasons: string[] = [
      "Shadow uses alternate blend weights (0.38 base / 0.32 trust / 0.30 performance); live uses marketplace `computeListingRank` (0.4/0.3/0.3) plus optional experiments.",
    ];

    const bundle = await computeBnhubRankingBundle(listingId);
    if (!bundle || liveScore == null) {
      rows.push({
        listingId,
        liveRankIndex,
        liveScore,
        shadowScore: null,
        delta: null,
        confidence: 0,
        reasons: [...reasons, "Skipped: missing bundle or live score."],
      });
      continue;
    }

    if (!platformCoreFlags.platformCoreV1) {
      rows.push({
        listingId,
        liveRankIndex,
        liveScore,
        shadowScore: null,
        delta: null,
        confidence: 0,
        reasons: [...reasons, "Shadow parallel blend requires platform core signals; live path may be bundle-only."],
      });
      continue;
    }

    const oneBrainTrust = await getAggregatedTrustScoreForListing(listingId);
    const base01 = finite01((bundle.rankingScore ?? 0) / 100);
    const perf01 = finite01((bundle.conversionScore ?? 0) / 100);
    let shadowBlended = computeShadowListingRank01({
      baseScore: base01,
      trustScore: oneBrainTrust,
      performanceScore: perf01,
    });
    if (!Number.isFinite(shadowBlended)) {
      shadowBlended = 0;
      reasons.push("Shadow blend non-finite — coerced to 0 for comparison.");
    }
    const shadowScore = Math.round(shadowBlended * 100 * 10) / 10;
    const delta = Number((shadowScore - liveScore).toFixed(4));
    reasons.push("Shadow omits adaptive multiplier, ranking experiments, and V3 cross-domain nudges (isolated formula comparison).");

    rows.push({
      listingId,
      liveRankIndex,
      liveScore,
      shadowScore,
      delta,
      confidence: confidenceFromDelta(delta),
      reasons,
    });
  }

  return rows;
}

export function summarizeRankingV8ShadowDiffs(rows: RankingV8ShadowDiffRow[]): {
  meanAbsDelta: number;
  maxAbsDelta: number;
} {
  const deltas = rows.map((r) => r.delta).filter((d): d is number => d != null && Number.isFinite(d));
  if (deltas.length === 0) return { meanAbsDelta: 0, maxAbsDelta: 0 };
  const abs = deltas.map((d) => Math.abs(d));
  return {
    meanAbsDelta: Number((abs.reduce((a, b) => a + b, 0) / abs.length).toFixed(6)),
    maxAbsDelta: Math.max(...abs),
  };
}
