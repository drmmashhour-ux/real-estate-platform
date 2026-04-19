/**
 * Week-over-week style trend from two equal windows — deterministic, no external API.
 */

import type { ForecastMomentum } from "@/modules/growth/revenue-forecast.types";

export type TrendInput = {
  currentLeads: number;
  priorLeads: number;
  currentQualified: number;
  priorQualified: number;
};

const THRESH = 0.05;

/**
 * growthRate: (current - prior) / max(prior, 1) for leads composite.
 * momentum: up if rate > THRESH, down if rate < -THRESH, else flat.
 */
export function computeRevenueTrendMetrics(input: TrendInput): {
  growthRate: number | null;
  momentum: ForecastMomentum;
} {
  const base = Math.max(input.priorLeads + input.priorQualified, 1);
  const delta =
    input.currentLeads +
    input.currentQualified -
    (input.priorLeads + input.priorQualified);
  const growthRate = delta / base;
  let momentum: ForecastMomentum = "flat";
  if (growthRate > THRESH) momentum = "up";
  else if (growthRate < -THRESH) momentum = "down";
  return { growthRate, momentum };
}
