export type PerformanceScoreInput = {
  views: number;
  clicks: number;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  conversions?: number | null;
};

/**
 * Deterministic 0–100 score for ranking content (not a business KPI on its own).
 */
export function computeContentPerformanceScore(m: PerformanceScoreInput): number {
  const engagement =
    (m.likes ?? 0) * 1 +
    (m.comments ?? 0) * 2 +
    (m.shares ?? 0) * 3 +
    m.clicks * 2 +
    (m.conversions ?? 0) * 10;
  const raw = Math.log1p(m.views) * 8 + Math.log1p(engagement) * 12;
  return Math.min(100, Math.round(raw * 10) / 10);
}
