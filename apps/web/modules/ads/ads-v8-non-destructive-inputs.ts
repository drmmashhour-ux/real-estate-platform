/**
 * Defensive normalization for V8 non-destructive analysis inputs (read-only callers).
 * Does not replace ads-performance.service — only hardens values before heuristics.
 */
import type { AdsPerformanceSummary, CampaignAdsMetrics } from "./ads-performance.service";

function finiteNonNeg(n: unknown, fallback = 0): number {
  if (typeof n === "number" && Number.isFinite(n) && n >= 0) return n;
  return fallback;
}

function finiteOrNull(n: unknown): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return null;
}

function safeKey(k: unknown): string {
  if (typeof k === "string" && k.trim()) return k.trim();
  return "(unknown_campaign)";
}

/**
 * Returns a safe CampaignAdsMetrics row; logs nothing (caller may warn).
 */
export function sanitizeCampaignAdsMetrics(raw: CampaignAdsMetrics): CampaignAdsMetrics {
  const impressions = finiteNonNeg(raw.impressions);
  const clicks = finiteNonNeg(raw.clicks);
  const leads = finiteNonNeg(raw.leads);
  const bookingsCompleted = finiteNonNeg(raw.bookingsCompleted);
  const estimatedSpend = finiteNonNeg(raw.estimatedSpend);
  let ctrPercent = finiteOrNull(raw.ctrPercent);
  let cpl = finiteOrNull(raw.cpl);
  let conversionRatePercent = finiteOrNull(raw.conversionRatePercent);
  if (clicks > impressions && impressions > 0) {
    ctrPercent = Math.min(100, (clicks / Math.max(1, impressions)) * 100);
  }
  if (leads > 0 && estimatedSpend <= 0) {
    cpl = null;
  }
  return {
    campaignKey: safeKey(raw.campaignKey),
    impressions,
    clicks,
    leads,
    bookingsCompleted,
    estimatedSpend,
    ctrPercent,
    cpl,
    conversionRatePercent,
  };
}

export function sanitizeCampaignAdsMetricsList(campaigns: CampaignAdsMetrics[]): CampaignAdsMetrics[] {
  return campaigns.map(sanitizeCampaignAdsMetrics);
}

/**
 * Ensures summary fields are finite; preserves structure of AdsPerformanceSummary.
 */
export function sanitizeAdsPerformanceSummaryForV8(summary: AdsPerformanceSummary): AdsPerformanceSummary {
  return {
    windowDays: finiteNonNeg(summary.windowDays, 1),
    since: typeof summary.since === "string" ? summary.since : new Date(0).toISOString(),
    until: typeof summary.until === "string" ? summary.until : new Date().toISOString(),
    impressions: finiteNonNeg(summary.impressions),
    clicks: finiteNonNeg(summary.clicks),
    leads: finiteNonNeg(summary.leads),
    bookingsStarted: finiteNonNeg(summary.bookingsStarted),
    bookingsCompleted: finiteNonNeg(summary.bookingsCompleted),
    estimatedSpend: finiteNonNeg(summary.estimatedSpend),
    ctrPercent: finiteOrNull(summary.ctrPercent),
    cpl: finiteOrNull(summary.cpl),
    conversionRatePercent: finiteOrNull(summary.conversionRatePercent),
  };
}
