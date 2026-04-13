/** Clamp any number into 0..1 (handles NaN / null / undefined). */
export function clamp01(n: number | null | undefined): number {
  if (n == null || Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Stored component scores in `listing_ranking_scores` are 0–1; UI may prefer 0–100. */
export function scaleTo100(n: number | null | undefined): number {
  return Math.round(clamp01(n) * 100 * 100) / 100;
}
