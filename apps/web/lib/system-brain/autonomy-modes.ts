import type { AutopilotMode } from "@/lib/ai/types";

/**
 * Platform control layer — **user-facing** autonomy vocabulary (4 modes).
 *
 * This is the safe stage: no blind auto-modification of production, payments, or legal flows.
 * Persisted settings today use `AutopilotMode` on `ManagerAiPlatformSettings`; use mappers below.
 *
 * | Mode                 | Behavior |
 * |----------------------|----------|
 * | OFF                  | No AI-driven actions (orchestrator returns off-state). |
 * | ASSIST               | Suggestions only — no auto side-effects. |
 * | SAFE_AUTOPILOT       | Auto **only** for allowlisted low-risk actions (copy tweaks, internal logs). |
 * | FULL_WITH_APPROVAL   | Broader automation allowed, but **sensitive categories always** require approval first. |
 */
export type AutonomyMode = "OFF" | "ASSIST" | "SAFE_AUTOPILOT" | "FULL_WITH_APPROVAL";

export const AUTONOMY_MODES: readonly AutonomyMode[] = [
  "OFF",
  "ASSIST",
  "SAFE_AUTOPILOT",
  "FULL_WITH_APPROVAL",
] as const;

export function isAutonomyMode(s: string | null | undefined): s is AutonomyMode {
  return s != null && (AUTONOMY_MODES as readonly string[]).includes(s);
}

/** Map UI / policy mode → existing DB `globalMode` values (backward compatible). */
export function autonomyModeToAutopilot(mode: AutonomyMode): AutopilotMode {
  switch (mode) {
    case "OFF":
      return "OFF";
    case "ASSIST":
      return "ASSIST_ONLY";
    case "SAFE_AUTOPILOT":
      return "AUTONOMOUS_SAFE";
    case "FULL_WITH_APPROVAL":
      return "AUTONOMOUS_MAX_WITH_OVERRIDE";
    default:
      return "ASSIST_ONLY";
  }
}

/** Best-effort display mode from stored `AutopilotMode`. */
export function autopilotToAutonomyMode(stored: AutopilotMode): AutonomyMode {
  switch (stored) {
    case "OFF":
      return "OFF";
    case "ASSIST_ONLY":
    case "RECOMMENDATIONS_ONLY":
      return "ASSIST";
    case "SEMI_AUTONOMOUS":
    case "AUTONOMOUS_SAFE":
    case "SAFE_AUTOPILOT":
      return "SAFE_AUTOPILOT";
    case "AUTONOMOUS_MAX_WITH_OVERRIDE":
    case "APPROVAL_AUTOPILOT":
      return "FULL_WITH_APPROVAL";
    case "ASSISTANT":
    case "RECOMMENDATIONS":
      return "ASSIST";
    default:
      return "ASSIST";
  }
}
