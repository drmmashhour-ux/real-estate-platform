import type { AgentKey, AutopilotMode, DecisionMode } from "./types";
import { normalizeAutonomyMode } from "./types";

export type PlatformAiSettings = {
  globalMode: AutopilotMode;
  automationsEnabled: boolean;
  agentModes: Partial<Record<AgentKey, AutopilotMode>>;
};

/** Per-agent mode overrides platform default when set. */
export function effectiveAutopilotMode(global: AutopilotMode, agentOverride?: AutopilotMode): AutopilotMode {
  return agentOverride ?? global;
}

/**
 * Map autonomy mode to orchestrator decision lane (chat + tool side effects).
 */
export function decisionModeForAutopilot(mode: AutopilotMode): DecisionMode {
  const m = normalizeAutonomyMode(mode);
  switch (m) {
    case "OFF":
      return "ASSIST_ONLY";
    case "ASSIST_ONLY":
    case "ASSISTANT":
      return "ASSIST_ONLY";
    case "RECOMMENDATIONS_ONLY":
    case "RECOMMENDATIONS":
      return "SUGGEST_ONLY";
    case "SEMI_AUTONOMOUS":
      return "AUTO_EXECUTE_SAFE";
    case "AUTONOMOUS_SAFE":
    case "SAFE_AUTOPILOT":
      return "AUTO_EXECUTE_SAFE";
    case "AUTONOMOUS_MAX_WITH_OVERRIDE":
    case "APPROVAL_AUTOPILOT":
      return "REQUIRE_APPROVAL";
    default:
      return "ASSIST_ONLY";
  }
}

export function canAutoExecuteSafe(decisionMode: DecisionMode): boolean {
  return decisionMode === "AUTO_EXECUTE_SAFE";
}

export function canQueueApproval(decisionMode: DecisionMode): boolean {
  return decisionMode === "REQUIRE_APPROVAL" || decisionMode === "AUTO_EXECUTE_SAFE";
}
