import { getWeight } from "@/lib/ab/learn";

export const RANKING_LEARN_KEY = "ranking_boost" as const;

export type RankableV2 = {
  views?: number | null;
  bookings?: number | null;
  price?: number | null;
  marketPrice?: number | null;
  /** 0–100 style score from `analyzeListing` / optimizer when attached. */
  aiScore?: number | null;
} & Record<string, unknown>;

/**
 * Core relevance score: demand, price edge, and optional AI quality.
 * Use {@link rankListingsV2} to multiply by the learned `ranking_boost` weight.
 */
export function computeScore(l: RankableV2): number {
  let score = 0;
  score += (Number(l.views) || 0) * 0.1;
  score += (Number(l.bookings) || 0) * 5;
  if (l.price && l.marketPrice && l.price < l.marketPrice) {
    score += 20;
  }
  if (l.aiScore != null && Number.isFinite(l.aiScore)) {
    score += (Number(l.aiScore) as number) * 0.5;
  }
  return score;
}

/**
 * `score * weight` preserves sort order for a **global** positive weight; use
 * {@link computeScoreWithWeight} for UI / diagnostics when you need the scaled value.
 */
export function computeScoreWithWeight(l: RankableV2, weight: number): number {
  return computeScore(l) * weight;
}

/** Sync sort by raw `computeScore` (no DB). */
export function rankListingsByRawScore(listings: RankableV2[]): RankableV2[] {
  return [...listings].sort((a, b) => computeScore(b) - computeScore(a));
}

/**
 * Sort by `computeScore` × `learning_metrics.ranking_boost` (default 1, clamped 0.5–2 in `getWeight`).
 */
export async function rankListingsV2(listings: RankableV2[]): Promise<RankableV2[]> {
  const w = await getWeight(RANKING_LEARN_KEY, 1);
  return [...listings].sort(
    (a, b) => computeScore(b) * w - computeScore(a) * w
  );
}
