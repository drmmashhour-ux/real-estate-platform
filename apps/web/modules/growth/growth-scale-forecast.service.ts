/**
 * Month-end revenue projection from current run-rate (UTC month) — advisory.
 */

import { buildRevenueTargetStatus, GROWTH_MONTHLY_TARGET_CAD } from "@/modules/growth/revenue-target.service";

export type GrowthForecastResult = {
  monthlyTargetCad: number;
  currentRevenueCad: number;
  progressPercent: number;
  /** naive: (month-to-date / elapsed days) * days in month */
  projectedMonthEndCad: number;
  dailyRunRateCad: number;
  utcDayOfMonth: number;
  utcDaysInMonth: number;
};

export async function buildGrowthForecast(): Promise<GrowthForecastResult> {
  const t = await buildRevenueTargetStatus();
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const utcDayOfMonth = now.getUTCDate();
  const utcDaysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

  const dailyRunRateCad = t.currentRevenue / Math.max(1, utcDayOfMonth);
  const projectedMonthEndCad = Math.round(dailyRunRateCad * utcDaysInMonth * 100) / 100;

  return {
    monthlyTargetCad: GROWTH_MONTHLY_TARGET_CAD,
    currentRevenueCad: t.currentRevenue,
    progressPercent: t.progressPercent,
    projectedMonthEndCad,
    dailyRunRateCad: Math.round(dailyRunRateCad * 100) / 100,
    utcDayOfMonth,
    utcDaysInMonth,
  };
}
