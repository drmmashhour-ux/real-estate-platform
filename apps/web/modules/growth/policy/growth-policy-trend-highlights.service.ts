/**
 * Short, deterministic strings — no invented causes; correlation language only.
 */

import { splitSeriesHalves } from "@/modules/growth/policy/growth-policy-trend-detection.service";
import type { PolicyTrendDirection } from "@/modules/growth/policy/growth-policy-trend.types";
import type { PolicyTrendPoint } from "@/modules/growth/policy/growth-policy-trend.types";

export function buildPolicyTrendHighlights(params: {
  series: PolicyTrendPoint[];
  insufficientData: boolean;
  overallTrend: PolicyTrendDirection;
  severityTrend: PolicyTrendDirection;
  recurrenceTrend: PolicyTrendDirection;
  domainTrends: PolicyDomainTrend[];
  daysWithData: number;
  windowDays: number;
}): string[] {
  const out: string[] = [];
  if (params.insufficientData) {
    out.push(
      "Low data: need more UTC days with stored policy evaluations before trend arrows are meaningful.",
    );
    return out.slice(0, 5);
  }

  const { previous, recent } = splitSeriesHalves(params.series);
  const prevCrit = previous.reduce((s, p) => s + p.criticalCount, 0);
  const recentCrit = recent.reduce((s, p) => s + p.criticalCount, 0);
  const prevRec = previous.reduce((s, p) => s + p.recurringCount, 0);
  const recentRec = recent.reduce((s, p) => s + p.recurringCount, 0);

  if (params.overallTrend === "improving") {
    out.push(
      "Overall risk proxy decreased in the recent half (fewer weighted critical/warning/recurring signals on snapshots — correlational only).",
    );
  } else if (params.overallTrend === "worsening") {
    out.push("Overall risk proxy increased in the recent half (snapshot comparison — not attributed to any single action).");
  } else if (params.overallTrend === "stable") {
    out.push("Overall signals were roughly flat between the first and second half of the window.");
  }

  const improvingD = params.domainTrends.filter((d) => d.trend === "improving");
  const bestEase = [...improvingD].sort(
    (a, b) => b.previousCount - b.currentCount - (a.previousCount - a.currentCount),
  )[0];
  if (bestEase) {
    out.push(
      `Largest easing signal: ${bestEase.domain} (recent ${bestEase.currentCount} vs prior half ${bestEase.previousCount}).`,
    );
  }

  const worseningD = params.domainTrends.filter((d) => d.trend === "worsening");
  const worstPressure = [...worseningD].sort(
    (a, b) => b.currentCount - b.previousCount - (a.currentCount - b.previousCount),
  )[0];
  if (worstPressure) {
    out.push(
      `Largest pressure signal: ${worstPressure.domain} (recent ${worstPressure.currentCount} vs prior half ${worstPressure.previousCount}).`,
    );
  }

  if (recentRec < prevRec && prevRec > 0) {
    out.push(`Recurring observations eased half-over-half (${prevRec} → ${recentRec}).`);
  }

  const maxRecDay = [...params.series].sort((a, b) => b.recurringCount - a.recurringCount)[0];
  if (maxRecDay?.hasData && maxRecDay.recurringCount > 0) {
    out.push(`Highest same-day recurrence count observed on ${maxRecDay.date}: ${maxRecDay.recurringCount}.`);
  }

  if (recentCrit < prevCrit) {
    out.push(`Critical findings mass moved down (recent half ${recentCrit} vs prior ${prevCrit}).`);
  }

  out.push(`UTC days with snapshots: ${params.daysWithData}/${params.windowDays}.`);

  return out.slice(0, 5);
}

export function buildPolicyTrendWarnings(params: {
  series: PolicyTrendPoint[];
  insufficientData: boolean;
  severityTrend: PolicyTrendDirection;
  recurrenceTrend: PolicyTrendDirection;
  daysWithData: number;
  windowDays: number;
  totalResolvedReviewsInWindow: number;
}): string[] {
  const out: string[] = [];
  if (params.insufficientData) {
    out.push(
      `Requires ≥3 UTC days with stored snapshots and window ≥4 days — currently ${params.daysWithData} snapshot days.`,
    );
    return out.slice(0, 5);
  }

  const totalCrit = params.series.reduce((s, p) => s + p.criticalCount, 0);
  const totalRec = params.series.reduce((s, p) => s + p.recurringCount, 0);

  if (params.severityTrend === "worsening") {
    out.push("Critical+warning mass rose in the recent half — inspect current findings list.");
  }
  if (params.recurrenceTrend === "worsening") {
    out.push("Recurring flagged findings increased half-over-half — check history for stale patterns.");
  }
  if (totalRec > 0 && params.recurrenceTrend !== "improving") {
    out.push(`${totalRec} recurring observations summed across days in-window — prioritize operator reviews.`);
  }
  if (totalCrit > 0 && params.severityTrend !== "improving") {
    out.push(`${totalCrit} critical observations recorded across the window days (snapshot cadence varies).`);
  }
  if (params.totalResolvedReviewsInWindow === 0 && params.daysWithData >= 5) {
    out.push("No resolved reviews logged in-window — effectiveness signal is muted.");
  }
  if (params.daysWithData / params.windowDays < 0.35) {
    out.push("Sparse polling: many UTC days lack snapshots; trends may lag reality.");
  }

  return out.slice(0, 5);
}
