/**
 * Weighted marketplace ranking (0–1 scale inputs). Used for browse “recommended” when the AI ranking flag is off,
 * and documented alongside the BNHub / FSBO scoring engines.
 */
export type MarketplaceRankingInputs01 = {
  demand01: number;
  conversion01: number;
  price01: number;
  quality01: number;
  recency01: number;
  host01: number;
  featured01: number;
};

export function computeMarketplaceRankingScore(input: MarketplaceRankingInputs01): number {
  const w =
    input.demand01 * 0.3 +
    input.conversion01 * 0.25 +
    input.price01 * 0.15 +
    input.quality01 * 0.15 +
    input.recency01 * 0.1 +
    input.host01 * 0.05 +
    input.featured01 * 0.08;
  return Math.max(0, Math.min(1, w));
}
