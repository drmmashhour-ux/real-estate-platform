/**
 * LECIPM field agent KPIs — target definitions (ops can tune).
 * Wire real counts from outreach / demo / closing systems into `field-kpi.adapters` (or Prisma) later.
 */

export const DAILY_TARGETS = {
  calls: 10,
  dmsOrContacts: 10,
  /** Show range 2–3 in UI; use midpoint for % unless system tracks separately. */
  demosBooked: { min: 2, max: 3 },
  demosCompleted: 3,
  followUps: 5,
} as const;

export const WEEKLY_TARGETS = {
  brokersContacted: { min: 50 },
  demosDone: { min: 15, max: 20 },
  trialsStarted: { min: 5, max: 8 },
  activatedBrokers: { min: 3, max: 5 },
  payingBrokers: { min: 1, max: 3 },
} as const;

/** Weights for daily score (0–100). Demos + conversions heaviest. */
export const DAILY_SCORE_WEIGHTS = {
  calls: 0.08,
  dms: 0.08,
  demosBooked: 0.18,
  demosCompleted: 0.3,
  followUps: 0.08,
  /** trials started today (if any) or same-day proxy */
  trialsOrConversions: 0.28,
} as const;

/** “Mid-day” = local hour for demo alerts. */
export const MIDDAY_ALERT_HOUR = 12;

export type KpiPace = "on_track" | "behind" | "critical";

export function progressToPace(percent: number): KpiPace {
  if (percent >= 85) return "on_track";
  if (percent >= 50) return "behind";
  return "critical";
}

export function paceToBarClass(pace: KpiPace): string {
  switch (pace) {
    case "on_track":
      return "bg-emerald-500";
    case "behind":
      return "bg-amber-500";
    default:
      return "bg-rose-500";
  }
}

export function paceToTextClass(pace: KpiPace): string {
  switch (pace) {
    case "on_track":
      return "text-emerald-300";
    case "behind":
      return "text-amber-300";
    default:
      return "text-rose-300";
  }
}
