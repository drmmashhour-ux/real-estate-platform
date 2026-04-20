/**
 * Deterministic comparisons between first/second window halves — no smoothing.
 */

import type { PolicyTrendDirection } from "@/modules/growth/policy/growth-policy-trend.types";
import type { PolicyTrendPoint } from "@/modules/growth/policy/growth-policy-trend.types";

/** Composite risk proxy for overall trend — weights critical + recurrence higher than info noise. */
export function policyTrendRiskScore(p: PolicyTrendPoint): number {
  if (!p.hasData) return 0;
  return 3 * p.criticalCount + p.warningCount + 0.25 * p.infoCount + 2 * p.recurringCount;
}

/** Severity-only mass (critical + warning findings per day snapshots). */
export function policyTrendSeverityMass(p: PolicyTrendPoint): number {
  if (!p.hasData) return 0;
  return p.criticalCount + p.warningCount;
}

export function splitSeriesHalves(series: PolicyTrendPoint[]): {
  previous: PolicyTrendPoint[];
  recent: PolicyTrendPoint[];
} {
  const n = series.length;
  const mid = Math.max(1, Math.floor(n / 2));
  return {
    previous: series.slice(0, mid),
    recent: series.slice(mid),
  };
}

function sumRisk(points: PolicyTrendPoint[]): number {
  return points.reduce((s, p) => s + policyTrendRiskScore(p), 0);
}

function sumSeverity(points: PolicyTrendPoint[]): number {
  return points.reduce((s, p) => s + policyTrendSeverityMass(p), 0);
}

function sumRecurrence(points: PolicyTrendPoint[]): number {
  return points.reduce((s, p) => s + (p.hasData ? p.recurringCount : 0), 0);
}

function compareMass(
  prev: number,
  recent: number,
  insufficient: boolean,
): PolicyTrendDirection {
  if (insufficient) return "insufficient_data";
  const denom = Math.max(1, prev, recent);
  const delta = recent - prev;
  const rel = delta / denom;
  if (rel < -0.08) return "improving";
  if (rel > 0.08) return "worsening";
  return "stable";
}

export function detectOverallTrend(
  series: PolicyTrendPoint[],
  insufficientData: boolean,
): PolicyTrendDirection {
  if (insufficientData) return "insufficient_data";
  const { previous, recent } = splitSeriesHalves(series);
  return compareMass(sumRisk(previous), sumRisk(recent), false);
}

export function detectSeverityTrend(
  series: PolicyTrendPoint[],
  insufficientData: boolean,
): PolicyTrendDirection {
  if (insufficientData) return "insufficient_data";
  const { previous, recent } = splitSeriesHalves(series);
  return compareMass(sumSeverity(previous), sumSeverity(recent), false);
}

export function detectRecurrenceTrend(
  series: PolicyTrendPoint[],
  insufficientData: boolean,
): PolicyTrendDirection {
  if (insufficientData) return "insufficient_data";
  const { previous, recent } = splitSeriesHalves(series);
  return compareMass(sumRecurrence(previous), sumRecurrence(recent), false);
}
