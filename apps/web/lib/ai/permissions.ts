import "server-only";

import type { AutopilotMode } from "@/lib/ai/types";

export type ManagerAutopilotDecisionMode = "SAFE" | "FULL";

export function decisionModeForAutopilot(mode: AutopilotMode): ManagerAutopilotDecisionMode {
  if (mode === "AUTONOMOUS_MAX_WITH_OVERRIDE" || mode === "FULL_AUTOPILOT_APPROVAL") return "FULL";
  return "SAFE";
}
