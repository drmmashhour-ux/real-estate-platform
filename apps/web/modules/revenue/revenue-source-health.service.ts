/**
 * GOOD / WEAK / CRITICAL per unified source — deterministic thresholds on real amounts + trends.
 */

import type {
  MoneySourceRow,
  SourceHealth,
  TrendDirection,
  UnifiedMoneySource,
} from "./money-os.types";
import type { RevenueDashboardSummary } from "./revenue-dashboard.types";

export function trendFromAmounts(current: number, prior: number): TrendDirection {
  if (!(prior > 0) && !(current > 0)) return "flat";
  if (!(prior > 0) && current > 0) return "up";
  const delta = (current - prior) / Math.max(prior, 1);
  if (delta > 0.07) return "up";
  if (delta < -0.07) return "down";
  return "flat";
}

export function scoreHealth(input: {
  pctOfWeekTotal: number;
  amountCad: number;
  trend: TrendDirection;
  activitySignal: number;
  /** e.g. booking starts for bnhub */
  criticalIfZeroWithActivity?: boolean;
}): SourceHealth {
  const { pctOfWeekTotal, amountCad, trend, activitySignal, criticalIfZeroWithActivity } = input;

  if (amountCad <= 0 && activitySignal >= 12 && criticalIfZeroWithActivity) return "CRITICAL";

  if (pctOfWeekTotal >= 22 && amountCad >= 75 && trend !== "down") return "GOOD";
  if (pctOfWeekTotal >= 12 && amountCad >= 25 && trend !== "down") return "GOOD";

  if (pctOfWeekTotal >= 8 && amountCad >= 15) return trend === "down" ? "WEAK" : "WEAK";

  if (amountCad <= 0 && activitySignal <= 4) return "WEAK";

  return "CRITICAL";
}

export function buildUnifiedSources(
  summary: RevenueDashboardSummary,
  priorWeekByUnified: Record<UnifiedMoneySource, number>,
): MoneySourceRow[] {
  const rs = summary.revenueBySource;
  const leads = rs.lead_unlock;
  const featured = rs.boost + rs.subscription;
  const bnhub = rs.booking_fee;
  const other = rs.other;
  const weekTotal = summary.revenueWeek || 1;

  const pct = (x: number) => Math.round((x / weekTotal) * 1000) / 10;

  const rows: Omit<MoneySourceRow, "health">[] = [
    {
      key: "leads",
      label: "Leads",
      amountCad: leads,
      pctOfWeekTotal: pct(leads),
      trend: trendFromAmounts(leads, priorWeekByUnified.leads),
      priorWeekCad: priorWeekByUnified.leads,
    },
    {
      key: "featured",
      label: "Featured / promoted",
      amountCad: featured,
      pctOfWeekTotal: pct(featured),
      trend: trendFromAmounts(featured, priorWeekByUnified.featured),
      priorWeekCad: priorWeekByUnified.featured,
    },
    {
      key: "bnhub",
      label: "BNHub bookings",
      amountCad: bnhub,
      pctOfWeekTotal: pct(bnhub),
      trend: trendFromAmounts(bnhub, priorWeekByUnified.bnhub),
      priorWeekCad: priorWeekByUnified.bnhub,
    },
    {
      key: "other",
      label: "Other",
      amountCad: other,
      pctOfWeekTotal: pct(other),
      trend: trendFromAmounts(other, priorWeekByUnified.other),
      priorWeekCad: priorWeekByUnified.other,
    },
  ];

  return rows.map((r) => {
    let activitySignal = 0;
    let criticalIfZeroWithActivity = false;
    if (r.key === "leads") activitySignal = summary.leadsViewed + summary.leadsUnlocked;
    if (r.key === "bnhub") {
      activitySignal = summary.bookingStarts + summary.bookingCompleted;
      criticalIfZeroWithActivity = true;
    }
    if (r.key === "featured") activitySignal = rs.boost > 0 || rs.subscription > 0 ? 20 : 2;
    if (r.key === "other") activitySignal = 1;

    const health = scoreHealth({
      pctOfWeekTotal: r.pctOfWeekTotal,
      amountCad: r.amountCad,
      trend: r.trend,
      activitySignal,
      criticalIfZeroWithActivity,
    });

    return { ...r, health };
  });
}
