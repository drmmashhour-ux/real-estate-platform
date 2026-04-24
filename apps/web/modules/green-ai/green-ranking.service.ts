import { logGreenEvent } from "./green-search-helpers";
import type { GreenRankingInput, GreenRankingSignal, GreenSearchResultDecoration, GreenRankingSortMode } from "./green-search.types";

function incentiveStrength(d: GreenSearchResultDecoration | null): "high" | "medium" | "low" | null {
  if (!d) return null;
  const n = d.estimatedIncentives;
  if (d.hasPotentialIncentives && n != null && n >= 8000) return "high";
  if (d.hasPotentialIncentives && n != null && n >= 3000) return "medium";
  if (d.hasPotentialIncentives) return "low";
  return null;
}

function signalForItem(
  d: GreenSearchResultDecoration | null,
  sortMode: GreenRankingSortMode
): GreenRankingSignal {
  return {
    currentScore: d?.currentScore ?? null,
    projectedScore: d?.projectedScore ?? null,
    scoreDelta: d?.scoreDelta ?? null,
    label: d?.label ?? null,
    improvementPotential: d?.improvementPotential ?? null,
    incentiveStrength: incentiveStrength(d),
    rankingBoostSuggestion: d?.rankingBoostSuggestion ?? null,
    rationale: d?.rationale?.slice(0, 3) ?? [],
  };
}

function sortKey(
  d: GreenSearchResultDecoration | null,
  base: number,
  orderIndex: number,
  mode: GreenRankingSortMode,
  audience: "public" | "internal"
): number {
  const c = d?.currentScore ?? 0;
  const p = d?.projectedScore ?? 0;
  const delta = d?.scoreDelta ?? 0;
  const boost = d?.rankingBoostSuggestion ?? 1;
  const inst = d?.hasPotentialIncentives ? 1 : 0;
  const e = d?.estimatedIncentives ?? 0;

  switch (mode) {
    case "green_best_now":
      return c * 1_000_000 + p * 1_000 + (audience === "internal" ? boost * 1_00 : 0) + (1_000 - orderIndex) * 0.0001;
    case "green_upgrade_potential": {
      const w = audience === "internal" ? 1.15 : 1.0;
      return delta * w * 1_000_000 + c * 1_000 + (1_000 - orderIndex) * 0.0001;
    }
    case "green_incentive_opportunity": {
      const w = audience === "internal" ? 1.2 : 0.9;
      return (e * w + inst * 50_000) * 1_00 + c * 100 + (1_000 - orderIndex) * 0.0001;
    }
    case "standard_with_green_boost":
    default: {
      // Light blend: base relevance (0–1) is primary; green nudges slightly.
      const nudge =
        audience === "public"
          ? 1 + 0.02 * (c / 100) * (boost - 1) * 0.5 + 0.01 * (Math.min(100, delta) / 100)
          : 1 + 0.04 * (c / 100) * (boost - 1) + 0.02 * (Math.min(100, delta) / 100) + 0.01 * (e / 50_000);
      return base * nudge * 1_000_000 - orderIndex * 0.1;
    }
  }
}

export type GreenRanked<T> = T & { __greenRank?: { signal: GreenRankingSignal; key: number } };

/**
 * Stable sort: preserves relative order of ties; uses `orderIndex` for determinism.
 */
export function rankListingsWithGreenSignals<T>(
  input: GreenRankingInput<T>
): { ranked: T[]; signals: Map<string, GreenRankingSignal> } {
  const { items, decorationById, getId, getBaseScore, sortMode, audience } = input;
  const withIdx = items.map((it, i) => ({
    it,
    i,
    id: getId(it),
  }));

  const keys = withIdx.map(({ it, i, id }) => {
    const d = decorationById.get(id) ?? null;
    const base = getBaseScore != null ? getBaseScore(it) ?? 0.5 : 0.5;
    return {
      it,
      i,
      id,
      d,
      key: sortKey(d, base, i, sortMode, audience),
    };
  });

  keys.sort((a, b) => {
    if (b.key !== a.key) return b.key - a.key;
    return a.i - b.i;
  });

  const signals = new Map<string, GreenRankingSignal>();
  const ranked: T[] = keys.map((k) => {
    const sig = signalForItem(k.d, sortMode);
    signals.set(k.id, sig);
    return k.it;
  });

  logGreenEvent("green_ranking_applied", { mode: sortMode, n: items.length, audience });
  return { ranked, signals };
}
