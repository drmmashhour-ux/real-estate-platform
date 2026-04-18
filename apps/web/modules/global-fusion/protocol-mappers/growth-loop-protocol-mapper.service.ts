/**
 * Global Growth Loop — growth priorities + funnel hints (advisory).
 */
import type { GlobalFusionOperatingProtocol, GlobalFusionProtocolGrowthLoopPayload } from "../global-fusion.types";

export function buildGrowthLoopProtocolPayload(protocol: GlobalFusionOperatingProtocol): GlobalFusionProtocolGrowthLoopPayload {
  const growthPri = protocol.priorities
    .filter((p) => p.targetSystems.includes("growth_loop"))
    .map((p) => p.title);
  const funnel = protocol.directives.find((d) => d.directiveType === "stabilize_funnel");
  return {
    version: 1,
    growthPriorities: growthPri.length ? growthPri : protocol.priorities.slice(0, 4).map((p) => p.title),
    funnelFocus: funnel?.summary ?? null,
    scalingVsOptimizationHint:
      protocol.conflicts.length > 0
        ? "Scaling intent may need reconciliation with stability or governance tensions (observational)."
        : null,
    signals: protocol.signals.filter((s) => s.targetSystems.includes("growth_loop")),
    notes: ["growth_loop_autonomy_preserved"],
  };
}
