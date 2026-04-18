/**
 * Revenue targets (CAD) — env-backed, deterministic. No auto-billing.
 */

import { getEffectiveDailyRevenueTargetCad } from "./revenue-dashboard-target";
import type { RevenueTargetBundle, TargetProgress } from "./money-os.types";

function envNum(k: string, fallback: number): number {
  const raw = process.env[k]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getRevenueTargetBundle(): RevenueTargetBundle {
  const dailyTargetCad = getEffectiveDailyRevenueTargetCad();
  const weeklyDefault = dailyTargetCad * 7;
  const monthlyDefault = dailyTargetCad * 30;
  return {
    dailyTargetCad,
    weeklyTargetCad: envNum("REVENUE_OS_WEEKLY_TARGET_CAD", weeklyDefault),
    monthlyTargetCad: envNum("REVENUE_OS_MONTHLY_TARGET_CAD", monthlyDefault),
  };
}

export function computeTargetProgress(
  revenueToday: number,
  revenueWeek: number,
  revenueMonth: number,
  targets: RevenueTargetBundle,
): TargetProgress {
  const pct = (actual: number, goal: number) =>
    !(goal > 0) ? null : Math.min(999, Math.round((actual / goal) * 1000) / 10);

  const gapDailyCad = Math.max(0, targets.dailyTargetCad - revenueToday);
  const gapWeeklyCad = Math.max(0, targets.weeklyTargetCad - revenueWeek);
  const gapMonthlyCad = Math.max(0, targets.monthlyTargetCad - revenueMonth);

  const gapMessageToday =
    gapDailyCad <= 0.005
      ? "Daily target reached or exceeded."
      : `Need ${fmtCadShort(gapDailyCad)} more today to hit target.`;

  return {
    dailyPct: pct(revenueToday, targets.dailyTargetCad),
    weeklyPct: pct(revenueWeek, targets.weeklyTargetCad),
    monthlyPct: pct(revenueMonth, targets.monthlyTargetCad),
    gapDailyCad,
    gapWeeklyCad,
    gapMonthlyCad,
    gapMessageToday,
  };
}

function fmtCadShort(n: number): string {
  return `$${n.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
