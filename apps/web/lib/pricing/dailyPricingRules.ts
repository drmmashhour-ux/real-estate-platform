import type { SeasonType } from "@/lib/market/seasonRules";

const ADJ_MIN = -0.1;
const ADJ_MAX = 0.3;

function isWeekendLocal(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Order 61 — pure adjustment: weekend, season, high-demand city, 30d occupancy; clamp -10% / +30%.
 */
export function buildDailyAdjustment(
  d: Date,
  season: SeasonType,
  cityDemandScore: number,
  occupancy30d: number
): { rawSum: number; clamped: number; reasons: string[] } {
  const reasons: string[] = [];
  let sum = 0;

  if (isWeekendLocal(d)) {
    sum += 0.08;
    reasons.push("Weekend");
  }
  if (season === "high_season") {
    sum += 0.12;
    reasons.push("High season");
  } else if (season === "low_season") {
    sum += -0.07;
    reasons.push("Low season");
  }
  if (cityDemandScore >= 100) {
    sum += 0.1;
    reasons.push("High demand");
  } else if (cityDemandScore >= 50) {
    reasons.push("Medium demand (no uplift)");
  }

  if (Number.isFinite(occupancy30d)) {
    if (occupancy30d > 0.8) {
      sum += 0.12;
      reasons.push("High occupancy");
    } else if (occupancy30d < 0.3) {
      sum += -0.05;
      reasons.push("Low occupancy");
    }
  }

  const clamped = Math.min(ADJ_MAX, Math.max(ADJ_MIN, sum));
  return { rawSum: sum, clamped, reasons };
}

export const order61AdjustmentClamp = { min: ADJ_MIN, max: ADJ_MAX };
