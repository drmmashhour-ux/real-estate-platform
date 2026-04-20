/**
 * Builds day-aligned series from persisted daily snapshots only — no interpolation.
 */

import { buildGrowthPolicyFingerprint } from "@/modules/growth/policy/growth-policy-fingerprint.service";
import type { GrowthPolicyDomain, GrowthPolicyResult } from "@/modules/growth/policy/growth-policy.types";
import type { PolicyTrendPoint } from "@/modules/growth/policy/growth-policy-trend.types";
import { getHistoryDocSnapshot } from "@/modules/growth/policy/growth-policy-history.store";
import { getTrendDailyDoc, upsertTrendDailySnapshot, utcDateKey } from "@/modules/growth/policy/growth-policy-trend.store";

function enumerateUtcDates(reference: Date, windowDays: number): string[] {
  const out: string[] = [];
  const y = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  const d = reference.getUTCDate();
  for (let i = windowDays - 1; i >= 0; i--) {
    const x = new Date(Date.UTC(y, m, d - i));
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

/** Persist one evaluation tick into today's UTC rollup (additive file; advisory only). */
export function recordPolicyTrendDailySnapshotFromEvaluation(
  policies: GrowthPolicyResult[],
  referenceDate: Date = new Date(),
): void {
  const doc = getHistoryDocSnapshot();
  const entries = doc.entries;
  const reviews = doc.reviews;

  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  const domainCounts: Partial<Record<GrowthPolicyDomain, number>> = {};

  for (const p of policies) {
    if (p.severity === "critical") criticalCount += 1;
    else if (p.severity === "warning") warningCount += 1;
    else infoCount += 1;
    domainCounts[p.domain] = (domainCounts[p.domain] ?? 0) + 1;
  }

  let recurringCount = 0;
  for (const p of policies) {
    const fp = buildGrowthPolicyFingerprint(p);
    const e = entries[fp];
    if (e?.currentStatus === "recurring") recurringCount += 1;
  }

  const dateUtc = utcDateKey(referenceDate);
  const resolvedReviewCount = reviews.filter(
    (r) => r.reviewedAt.startsWith(dateUtc) && r.reviewDecision === "resolved",
  ).length;

  upsertTrendDailySnapshot({
    dateUtc,
    updatedAt: referenceDate.toISOString(),
    totalFindings: policies.length,
    criticalCount,
    warningCount,
    infoCount,
    recurringCount,
    resolvedReviewCount,
    domainCounts,
  });
}

export type PolicyTrendSeriesResult = {
  series: PolicyTrendPoint[];
  daysWithData: number;
  insufficientData: boolean;
};

/** Minimum days with ≥1 snapshot required before trend math (not counting all-zero fabricated days). */
export const POLICY_TREND_MIN_DAYS_WITH_DATA = 3;

export function buildPolicyTrendSeries(
  windowDays: number,
  referenceDate: Date = new Date(),
): PolicyTrendSeriesResult {
  const doc = getTrendDailyDoc();
  const dates = enumerateUtcDates(referenceDate, windowDays);

  let daysWithData = 0;
  const series: PolicyTrendPoint[] = dates.map((date) => {
    const snap = doc.byDay[date];
    if (!snap) {
      return {
        date,
        totalFindings: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        recurringCount: 0,
        resolvedCount: 0,
        hasData: false,
      };
    }
    daysWithData += 1;
    return {
      date,
      totalFindings: snap.totalFindings,
      criticalCount: snap.criticalCount,
      warningCount: snap.warningCount,
      infoCount: snap.infoCount,
      recurringCount: snap.recurringCount,
      resolvedCount: snap.resolvedReviewCount,
      hasData: true,
    };
  });

  /** See docs: need enough observed UTC days and a minimum calendar window. */
  const insufficientData =
    windowDays < 4 || daysWithData < POLICY_TREND_MIN_DAYS_WITH_DATA;

  return { series, daysWithData, insufficientData };
}
