import type { ContentPerformanceSummary } from "./aggregate-metrics";

/**
 * Lightweight rule-based suggestions (no ML). Extend as patterns emerge.
 */
export function suggestImprovements(
  summary: ContentPerformanceSummary,
  contentPreview: string
): string[] {
  const suggestions: string[] = [];
  const len = contentPreview.length;

  if (len > 650) {
    suggestions.push("Try a shorter hook — long drafts often underperform in feed.");
  }
  if (len > 0 && len < 70) {
    suggestions.push("Consider one more concrete value line — very short copy can lack clarity.");
  }

  if (summary.totalViews >= 40 && (summary.ctrPercent ?? 0) < 1) {
    suggestions.push("CTR is low vs impressions — test a stronger opening line or clearer CTA.");
  }

  if (summary.totalClicks >= 15 && (summary.conversionPercent ?? 0) < 2) {
    suggestions.push("Clicks are not converting — align promise with the next step or tighten the ask.");
  }

  if (summary.totalViews >= 30 && (summary.openRatePercent ?? 0) > 0 && (summary.openRatePercent ?? 0) < 12) {
    suggestions.push("Email open rate is soft — try a more specific subject line (avoid generic headlines).");
  }

  if (suggestions.length === 0) {
    suggestions.push("Keep logging metrics — more snapshots will sharpen these suggestions.");
  }

  return suggestions;
}
