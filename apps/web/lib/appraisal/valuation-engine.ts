/**
 * Indicative pricing analysis from comparable prices (cents). Not a certified opinion.
 */
export function computeIndicativeValueFromPricesCents(pricesCents: number[]): {
  medianCents: number | null;
  lowCents: number | null;
  highCents: number | null;
  count: number;
} {
  const valid = pricesCents.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (valid.length === 0) {
    return { medianCents: null, lowCents: null, highCents: null, count: 0 };
  }
  const mid = Math.floor(valid.length / 2);
  const medianCents = valid.length % 2 === 1 ? valid[mid]! : Math.round((valid[mid - 1]! + valid[mid]!) / 2);
  return {
    medianCents,
    lowCents: valid[0]!,
    highCents: valid[valid.length - 1]!,
    count: valid.length,
  };
}
