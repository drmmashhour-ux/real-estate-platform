/** Safe ratio for CTR, conversion rate, open rate (no NaN / Inf). */
export function safeRatio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return null;
  }
  return numerator / denominator;
}

export function ratioToPercent(ratio: number | null, decimals = 2): number | null {
  if (ratio == null) return null;
  return Math.round(ratio * 100 * 10 ** decimals) / 10 ** decimals;
}
