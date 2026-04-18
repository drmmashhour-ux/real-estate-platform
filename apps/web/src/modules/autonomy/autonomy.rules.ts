/** Risk thresholds — conservative defaults. */
export const AUTONOMY = {
  /** Stricter than v1: only lower-risk (higher blended-score) items reach auto queue when autonomy is on. */
  maxRiskScoreForAutoQueue: 50,
  killSwitchEnv: "GROWTH_AUTONOMY_KILL_SWITCH",
  modeEnv: "GROWTH_AUTONOMY_MODE",
} as const;

export type AutonomyMode = "OFF" | "SAFE" | "ASSIST" | "GUARDED";

export function parseAutonomyMode(): AutonomyMode {
  if (process.env[AUTONOMY.killSwitchEnv] === "1" || process.env[AUTONOMY.killSwitchEnv] === "true") {
    return "OFF";
  }
  const raw = process.env[AUTONOMY.modeEnv]?.trim().toUpperCase();
  if (raw === "OFF" || raw === "SAFE" || raw === "ASSIST" || raw === "GUARDED") return raw;
  return "SAFE";
}
