import type { GrowthAutonomyMode } from "./growth-engine.types";

const VALID: GrowthAutonomyMode[] = ["OFF", "ASSIST", "SAFE_AUTOPILOT", "FULL_AUTOPILOT_APPROVAL"];

function parseEnv(): GrowthAutonomyMode {
  const raw = process.env.GROWTH_ENGINE_AUTONOMY?.trim().toUpperCase().replace(/-/g, "_");
  if (!raw) return "SAFE_AUTOPILOT";
  const map: Record<string, GrowthAutonomyMode> = {
    OFF: "OFF",
    ASSIST: "ASSIST",
    SAFE_AUTOPILOT: "SAFE_AUTOPILOT",
    SAFEAUTOPILOT: "SAFE_AUTOPILOT",
    FULL_AUTOPILOT_APPROVAL: "FULL_AUTOPILOT_APPROVAL",
    FULLAUTOPILOT_APPROVAL: "FULL_AUTOPILOT_APPROVAL",
    FULL_AUTOPILOTAPPROVAL: "FULL_AUTOPILOT_APPROVAL",
  };
  const m = map[raw.replace(/\s+/g, "_")] ?? map[raw];
  if (m && VALID.includes(m)) return m;
  return "SAFE_AUTOPILOT";
}

export function getGrowthAutonomyMode(): GrowthAutonomyMode {
  return parseEnv();
}

/** Full autopilot requires human approval for every execution path (nothing auto except logging proposal). */
export function shouldAutoExecuteSafeActions(mode: GrowthAutonomyMode): boolean {
  return mode === "SAFE_AUTOPILOT";
}

export function shouldSuggestOnly(mode: GrowthAutonomyMode): boolean {
  return mode === "ASSIST" || mode === "OFF";
}

export function engineIsOff(mode: GrowthAutonomyMode): boolean {
  return mode === "OFF";
}

/** In FULL_AUTOPILOT_APPROVAL every execute path queues approval first. */
export function requiresApprovalForAllActions(mode: GrowthAutonomyMode): boolean {
  return mode === "FULL_AUTOPILOT_APPROVAL";
}
