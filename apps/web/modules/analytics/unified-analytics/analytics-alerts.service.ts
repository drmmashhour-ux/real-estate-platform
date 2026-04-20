import type { UnifiedAnalyticsAlert } from "./unified-analytics.types";

export function buildAnalyticsAlerts(params: {
  conversionRate: number;
  revenueCents: number;
  revenuePrevCents: number;
  anomalyZ: number;
}): UnifiedAnalyticsAlert[] {
  const alerts: UnifiedAnalyticsAlert[] = [];
  if (params.conversionRate < 0.02 && params.conversionRate >= 0) {
    alerts.push({
      id: "low-conversion",
      severity: "warning",
      title: "Conversion is low",
      detail: "Won or qualified progression is below a healthy baseline for this window — inspect funnel bottlenecks.",
    });
  }
  if (params.revenuePrevCents > 0 && params.revenueCents < params.revenuePrevCents * 0.75) {
    alerts.push({
      id: "revenue-drop",
      severity: "warning",
      title: "Revenue dropped vs prior window",
      detail: "Paid platform revenue is materially lower than the comparison period.",
    });
  }
  if (Math.abs(params.anomalyZ) > 3) {
    alerts.push({
      id: "volume-anomaly",
      severity: "info",
      title: "Unusual traffic or lead pattern",
      detail: "Daily lead volume deviated strongly from the rolling mean — confirm tracking and campaigns.",
    });
  }
  return alerts;
}
