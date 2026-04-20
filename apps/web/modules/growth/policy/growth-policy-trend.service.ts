/**
 * Advisory trend rollup — combines snapshots only; never mutates policy evaluation output.
 */

import {
  detectOverallTrend,
  detectRecurrenceTrend,
  detectSeverityTrend,
} from "@/modules/growth/policy/growth-policy-trend-detection.service";
import { buildPolicyDomainTrends } from "@/modules/growth/policy/growth-policy-trend-domain.service";
import {
  buildPolicyTrendHighlights,
  buildPolicyTrendWarnings,
} from "@/modules/growth/policy/growth-policy-trend-highlights.service";
import {
  buildPolicyTrendSeries,
  POLICY_TREND_MIN_DAYS_WITH_DATA,
} from "@/modules/growth/policy/growth-policy-trend-timeseries.service";
import type {
  PolicyTrendConfidence,
  PolicyTrendSummary,
} from "@/modules/growth/policy/growth-policy-trend.types";
import {
  logGrowthPolicyTrendLowConfidence,
  logGrowthPolicyTrendSummaryBuilt,
} from "@/modules/growth/policy/growth-policy-trend-monitoring.service";

function trendConfidence(
  daysWithData: number,
  windowDays: number,
  insufficient: boolean,
): PolicyTrendConfidence {
  if (insufficient) {
    try {
      logGrowthPolicyTrendLowConfidence({ reason: `days_with_data=${daysWithData}<${POLICY_TREND_MIN_DAYS_WITH_DATA}` });
    } catch {
      /* ignore */
    }
    return "low";
  }
  const ratio = daysWithData / Math.max(1, windowDays);
  if (daysWithData >= 10 && ratio >= 0.6) return "high";
  if (daysWithData >= 5 && ratio >= 0.35) return "medium";
  try {
    logGrowthPolicyTrendLowConfidence({ reason: `sparse_ratio=${ratio.toFixed(2)}` });
  } catch {
    /* ignore */
  }
  return "low";
}

export function buildGrowthPolicyTrendSummary(
  windowDays: 7 | 30 = 7,
  referenceDate: Date = new Date(),
): PolicyTrendSummary {
  const { series, daysWithData, insufficientData } = buildPolicyTrendSeries(windowDays, referenceDate);

  const overallTrend = detectOverallTrend(series, insufficientData);
  const severityTrend = detectSeverityTrend(series, insufficientData);
  const recurrenceTrend = detectRecurrenceTrend(series, insufficientData);
  const domainTrends = buildPolicyDomainTrends(series, insufficientData);

  const totalResolved = series.reduce((s, p) => s + p.resolvedCount, 0);

  const highlights = buildPolicyTrendHighlights({
    series,
    insufficientData,
    overallTrend,
    severityTrend,
    recurrenceTrend,
    domainTrends,
    daysWithData,
    windowDays,
  });

  const warnings = buildPolicyTrendWarnings({
    series,
    insufficientData,
    severityTrend,
    recurrenceTrend,
    daysWithData,
    windowDays,
    totalResolvedReviewsInWindow: totalResolved,
  });

  const confidence = trendConfidence(daysWithData, windowDays, insufficientData);

  const summary: PolicyTrendSummary = {
    windowDays,
    overallTrend,
    severityTrend,
    recurrenceTrend,
    domainTrends,
    highlights,
    warnings,
    confidence,
    generatedAt: referenceDate.toISOString(),
    series,
  };

  try {
    logGrowthPolicyTrendSummaryBuilt({
      windowDays,
      confidence,
      insufficient: insufficientData,
      overall: overallTrend,
    });
  } catch {
    /* ignore */
  }

  return summary;
}
