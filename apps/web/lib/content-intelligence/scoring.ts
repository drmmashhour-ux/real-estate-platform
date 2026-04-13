/**
 * Weighted performance score for learning loops. Tune weights as signal quality improves.
 * Revenue is scaled so it does not dwarf engagement on typical BNHub ranges.
 */

export type PerformanceMetrics = {
  views: number;
  clicks: number;
  saves: number;
  shares: number;
  /** Generic conversion events (legacy). */
  conversions: number;
  /** Attributed bookings / stays. */
  bookings: number;
  /** Total attributed revenue in cents. */
  revenueCents: number;
};

export const DEFAULT_SCORE_WEIGHTS = {
  views: 1,
  clicks: 5,
  saves: 8,
  shares: 12,
  conversions: 25,
  bookings: 80,
  /** Per $100 of attributed revenue (revenueCents / 10000). */
  revenuePerDollar: 3,
} as const;

/**
 * Single scalar for ranking and cohort selection.
 */
export function computeContentPerformanceScore(
  m: PerformanceMetrics,
  w: typeof DEFAULT_SCORE_WEIGHTS = DEFAULT_SCORE_WEIGHTS
): number {
  const revenueDollars = m.revenueCents / 100;
  return (
    w.views * safeN(m.views) +
    w.clicks * safeN(m.clicks) +
    w.saves * safeN(m.saves) +
    w.shares * safeN(m.shares) +
    w.conversions * safeN(m.conversions) +
    w.bookings * safeN(m.bookings) +
    w.revenuePerDollar * revenueDollars
  );
}

function safeN(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Backward-compatible score when only legacy columns exist (pre-migration rows). */
export function legacyScoreFromRow(row: {
  views: number;
  clicks: number;
  conversions: number;
  saves?: number;
  shares?: number;
  bookings?: number;
  revenueCents?: number;
}): number {
  return computeContentPerformanceScore({
    views: row.views,
    clicks: row.clicks,
    saves: row.saves ?? 0,
    shares: row.shares ?? 0,
    conversions: row.conversions,
    bookings: row.bookings ?? 0,
    revenueCents: row.revenueCents ?? 0,
  });
}
