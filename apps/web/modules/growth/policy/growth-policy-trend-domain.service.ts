/**
 * Per-domain first-half vs second-half comparison from daily snapshot domain rolls.
 */

import type { GrowthPolicyDomain } from "@/modules/growth/policy/growth-policy.types";
import type {
  PolicyDomainTrend,
  PolicyTrendDirection,
  PolicyTrendMagnitude,
} from "@/modules/growth/policy/growth-policy-trend.types";
import { getTrendDailyDoc, type PolicyTrendDailySnapshot } from "@/modules/growth/policy/growth-policy-trend.store";
import { splitSeriesHalves } from "@/modules/growth/policy/growth-policy-trend-detection.service";
import type { PolicyTrendPoint } from "@/modules/growth/policy/growth-policy-trend.types";

const DOMAINS: GrowthPolicyDomain[] = [
  "governance",
  "ads",
  "leads",
  "messaging",
  "broker",
  "pricing",
  "content",
  "cro",
];

function sumDomainForHalf(
  dates: string[],
  domain: GrowthPolicyDomain,
  byDay: Record<string, PolicyTrendDailySnapshot>,
): number {
  let s = 0;
  for (const d of dates) {
    const snap = byDay[d];
    if (!snap) continue;
    s += snap.domainCounts[domain] ?? 0;
  }
  return s;
}

function magnitudeForDelta(delta: number, baseline: number): PolicyTrendMagnitude {
  const a = Math.abs(delta);
  if (baseline === 0 && a === 0) return "low";
  const b = Math.max(1, baseline, a);
  const rel = a / b;
  if (rel >= 0.4 || a >= 4) return "high";
  if (rel >= 0.15 || a >= 2) return "medium";
  return "low";
}

function domainDirection(
  previous: number,
  current: number,
  insufficient: boolean,
): PolicyTrendDirection {
  if (insufficient) return "insufficient_data";
  const denom = Math.max(1, previous, current);
  const rel = (current - previous) / denom;
  if (rel < -0.1) return "improving";
  if (rel > 0.1) return "worsening";
  return "stable";
}

function domainExplanation(
  domain: GrowthPolicyDomain,
  dir: PolicyTrendDirection,
  previous: number,
  current: number,
): string {
  if (dir === "insufficient_data") {
    return `${domain}: not enough daily snapshots to compare halves.`;
  }
  if (dir === "stable") {
    return `${domain}: finding counts were similar in the first vs second half of the window (prev ${previous} → recent ${current}).`;
  }
  if (dir === "improving") {
    return `${domain}: fewer policy findings in the recent half (prev ${previous} → recent ${current}). Correlation, not proven cause.`;
  }
  return `${domain}: more policy findings in the recent half (prev ${previous} → recent ${current}). Correlation, not proven cause.`;
}

export function buildPolicyDomainTrends(
  series: PolicyTrendPoint[],
  insufficientData: boolean,
): PolicyDomainTrend[] {
  if (insufficientData) {
    return [];
  }

  const { previous, recent } = splitSeriesHalves(series);
  const prevDates = previous.map((p) => p.date);
  const recentDates = recent.map((p) => p.date);
  const { byDay } = getTrendDailyDoc();

  const rows: PolicyDomainTrend[] = DOMAINS.map((domain) => {
    const pCount = sumDomainForHalf(prevDates, domain, byDay);
    const cCount = sumDomainForHalf(recentDates, domain, byDay);
    const dir = domainDirection(pCount, cCount, false);
    const mag = magnitudeForDelta(cCount - pCount, Math.max(pCount, cCount));
    return {
      domain,
      trend: dir,
      changeMagnitude: mag,
      currentCount: cCount,
      previousCount: pCount,
      explanation: domainExplanation(domain, dir, pCount, cCount),
    };
  });

  return [...rows]
    .sort(
      (a, b) =>
        Math.max(b.currentCount, b.previousCount) - Math.max(a.currentCount, a.previousCount) ||
        a.domain.localeCompare(b.domain),
    )
    .slice(0, 7);
}
