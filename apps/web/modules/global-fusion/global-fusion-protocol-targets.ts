/**
 * Advisory target-system inference for Phase H (heuristic, non-binding).
 */
import type { GlobalFusionExecutiveThemeId, GlobalFusionProtocolTargetSystem } from "./global-fusion.types";

export function inferTargetsFromExecutiveTheme(theme: GlobalFusionExecutiveThemeId): GlobalFusionProtocolTargetSystem[] {
  switch (theme) {
    case "growth_acceleration":
      return ["growth_loop", "swarm"];
    case "stability_first":
      return ["platform_core", "operator", "command_center"];
    case "launch_readiness":
      return ["operator", "platform_core", "command_center"];
    case "governance_attention":
      return ["command_center", "platform_core", "swarm"];
    case "evidence_gap":
      return ["growth_loop", "command_center", "operator"];
    case "operational_blocker":
      return ["operator", "platform_core"];
    case "ranking_expansion_candidate":
      return ["growth_loop", "platform_core"];
    case "funnel_first":
      return ["growth_loop", "operator"];
    case "human_review_required":
      return ["command_center", "swarm", "operator"];
    case "neutral":
    default:
      return ["command_center"];
  }
}

export function mergeTargets(
  a: GlobalFusionProtocolTargetSystem[],
  b: GlobalFusionProtocolTargetSystem[],
): GlobalFusionProtocolTargetSystem[] {
  return [...new Set([...a, ...b])];
}
