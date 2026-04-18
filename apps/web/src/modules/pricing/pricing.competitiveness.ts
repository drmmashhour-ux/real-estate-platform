import { clamp01 } from "@/lib/ranking/normalize-metrics";

function medianCents(values: number[]): number | null {
  const nums = values.filter((n) => n > 0).sort((a, b) => a - b);
  const n = nums.length;
  if (n === 0) return null;
  const m = Math.floor(n / 2);
  return n % 2 === 1 ? nums[m]! : Math.round((nums[m - 1]! + nums[m]!) / 2);
}

/**
 * Price competitiveness vs internal comparables (0–100), aligned with `getPriceCompetitivenessFsbo` semantics.
 * Higher = closer to peer median (fair pricing signal for ranking), not "cheaper is always better".
 */
export function calculatePriceCompetitiveness(
  listing: { priceCents: number },
  comparableListings: Array<{ priceCents: number }>,
): {
  score0to100: number;
  marketMedian: number | null;
  marketSampleSize: number;
  lowConfidence: boolean;
} {
  const median = medianCents(comparableListings.map((c) => c.priceCents));
  const marketSampleSize = comparableListings.filter((c) => c.priceCents > 0).length;
  const lowConfidence = marketSampleSize < 6 || median == null || median <= 0;
  if (median == null || median <= 0) {
    return { score0to100: 60, marketMedian: null, marketSampleSize, lowConfidence: true };
  }
  const ratio = listing.priceCents / median;
  const dev = Math.abs(Math.log(Math.max(0.01, ratio)));
  const comp01 = clamp01(1 - Math.min(1, dev / Math.log(5)));
  return {
    score0to100: Math.round(comp01 * 100),
    marketMedian: median / 100,
    marketSampleSize,
    lowConfidence,
  };
}
