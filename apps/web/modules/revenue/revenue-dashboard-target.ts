/**
 * Daily revenue target — env-backed default for operator goal strip (no payout side effects).
 */

function envNum(k: string, fallback: number): number {
  const raw = process.env[k]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Effective daily revenue target in CAD (same units as RevenueEvent.amount). */
export function getEffectiveDailyRevenueTargetCad(): number {
  return envNum("REVENUE_DASHBOARD_DAILY_TARGET_DEFAULT", 750);
}

export type DailyTargetProgress = {
  targetCad: number;
  todayCad: number;
  pctToGoal: number | null;
};

export function computeDailyTargetProgress(todayCad: number): DailyTargetProgress {
  const targetCad = getEffectiveDailyRevenueTargetCad();
  if (!(targetCad > 0)) {
    return { targetCad: 0, todayCad, pctToGoal: null };
  }
  const pctToGoal = Math.min(999, todayCad / targetCad);
  return { targetCad, todayCad, pctToGoal };
}
