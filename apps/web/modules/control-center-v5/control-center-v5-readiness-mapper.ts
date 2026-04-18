import type { AiControlCenterRolloutSummary, ExecutiveOverallStatus } from "@/modules/control-center/ai-control-center.types";
import type { CommandCenterLaunchReadiness } from "./company-command-center-v5.types";

export function deriveLaunchReadiness(
  overall: ExecutiveOverallStatus,
  rollout: AiControlCenterRolloutSummary,
): CommandCenterLaunchReadiness {
  if (rollout.blockedSystems.length > 0 || overall === "critical") return "hold";
  if (overall === "warning" || overall === "limited") return "caution";
  return "go";
}
