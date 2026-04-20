import type { SeoPerformanceSnapshot } from "./seo-engine.types";

/**
 * Placeholder performance aggregates until GSC / GA4 connectors are wired.
 * Callers should merge real metrics when available.
 */
export function createPlaceholderSeoPerformanceSnapshot(overrides?: Partial<SeoPerformanceSnapshot>): SeoPerformanceSnapshot {
  const now = new Date().toISOString();
  return {
    generatedAt: now,
    pagesGeneratedTotal: overrides?.pagesGeneratedTotal ?? 0,
    indexedTargetsEstimate: overrides?.indexedTargetsEstimate ?? 0,
    organicCtrPlaceholder: overrides?.organicCtrPlaceholder ?? null,
    topLandingPagesPlaceholder: overrides?.topLandingPagesPlaceholder ?? [],
    conversionsFromOrganicPlaceholder: overrides?.conversionsFromOrganicPlaceholder ?? null,
    notes: [
      "Connect Google Search Console for impressions, CTR, and average position.",
      "Map `listing_view` / `organic_landing` analytics events for conversion attribution.",
      ...(overrides?.notes ?? []),
    ],
  };
}

export function bumpGeneratedPageCount(
  snapshot: SeoPerformanceSnapshot,
  delta: number
): SeoPerformanceSnapshot {
  return {
    ...snapshot,
    pagesGeneratedTotal: Math.max(0, snapshot.pagesGeneratedTotal + delta),
    generatedAt: new Date().toISOString(),
  };
}
