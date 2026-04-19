/**
 * Independent rollout + cohort for low-risk auto-execution (separate from base autonomy rollout).
 */

import type { GrowthAutonomyAutoLowRiskRolloutStage } from "./growth-autonomy-auto.types";

export function parseGrowthAutonomyAutoLowRiskRolloutFromEnv(): GrowthAutonomyAutoLowRiskRolloutStage {
  const raw = (process.env.FEATURE_GROWTH_AUTONOMY_AUTO_LOW_RISK_ROLLOUT ?? "off").trim().toLowerCase();
  if (raw === "internal" || raw === "partial" || raw === "full") return raw;
  return "off";
}

export function parseGrowthAutonomyAutoLowRiskMinConfidence(): number {
  const raw = process.env.GROWTH_AUTONOMY_AUTO_LOW_RISK_MIN_CONFIDENCE;
  if (raw === undefined || raw === "") return 0.62;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.min(0.95, Math.max(0.35, n)) : 0.62;
}

/** Duplicate window for idempotent auto-runs (hours). */
export function parseGrowthAutonomyAutoDedupeHours(): number {
  const raw = process.env.GROWTH_AUTONOMY_AUTO_LOW_RISK_DEDUPE_HOURS;
  if (raw === undefined || raw === "") return 24;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(168, n) : 24;
}
