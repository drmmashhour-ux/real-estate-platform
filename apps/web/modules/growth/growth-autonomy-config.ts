/**
 * Env-backed autonomy mode + rollout stage (server-side).
 */

import type { GrowthAutonomyMode, GrowthAutonomyRolloutStage } from "./growth-autonomy.types";

export function parseGrowthAutonomyModeFromEnv(): GrowthAutonomyMode {
  const raw = (process.env.FEATURE_GROWTH_AUTONOMY_MODE ?? "OFF").trim().toUpperCase().replace(/-/g, "_");
  if (raw === "ASSIST") return "ASSIST";
  if (raw === "SAFE_AUTOPILOT" || raw === "SAFEAUTOPILOT") return "SAFE_AUTOPILOT";
  return "OFF";
}

export function parseGrowthAutonomyRolloutFromEnv(): GrowthAutonomyRolloutStage {
  const raw = (process.env.FEATURE_GROWTH_AUTONOMY_ROLLOUT ?? "off").trim().toLowerCase();
  if (raw === "internal" || raw === "partial" || raw === "full") return raw;
  return "off";
}
