/**
 * Derived ratios — undefined when inputs missing or division invalid (never fake zeros).
 */

import type { FastDealCityMetrics } from "@/modules/growth/fast-deal-city-comparison.types";

export type DerivedRates = {
  captureRate?: number;
  playbookCompletionRate?: number;
  progressionRate?: number;
  closeRate?: number;
};

/** captureRate = leadsCaptured / sourcingSessions when both defined and denominator > 0 */
export function computeDerivedRates(metrics: Omit<FastDealCityMetrics, "derived" | "meta">): DerivedRates {
  const a = metrics.activity;
  const e = metrics.execution;
  const p = metrics.progression;

  const out: DerivedRates = {};

  if (
    a.leadsCaptured != null &&
    a.sourcingSessions != null &&
    a.sourcingSessions > 0
  ) {
    out.captureRate = a.leadsCaptured / a.sourcingSessions;
  }

  if (
    e.playbookCompleted != null &&
    e.playbookStarted != null &&
    e.playbookStarted > 0
  ) {
    out.playbookCompletionRate = e.playbookCompleted / e.playbookStarted;
  }

  if (
    p.dealsProgressed != null &&
    a.leadsCaptured != null &&
    a.leadsCaptured > 0
  ) {
    out.progressionRate = p.dealsProgressed / a.leadsCaptured;
  }

  if (
    p.dealsClosed != null &&
    a.leadsCaptured != null &&
    a.leadsCaptured > 0
  ) {
    out.closeRate = p.dealsClosed / a.leadsCaptured;
  }

  return out;
}
