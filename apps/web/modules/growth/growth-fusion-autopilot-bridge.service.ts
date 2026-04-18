/**
 * Optional merge path: fusion-derived rows as advisory autopilot-shaped items.
 * Does not persist, approve, or execute — consumers must still use policy + approvals.
 */

import { growthFusionFlags } from "@/config/feature-flags";
import type { AiAutopilotAction } from "./ai-autopilot.types";
import type { GrowthFusionAction } from "./growth-fusion.types";

function mapFusionSourceToAutopilot(source: GrowthFusionAction["source"]): AiAutopilotAction["source"] {
  if (source === "ads") return "ads";
  if (source === "cro") return "cro";
  return "leads";
}

function toSignalStrength(score: number): AiAutopilotAction["signalStrength"] {
  if (score >= 72) return "strong";
  if (score >= 48) return "medium";
  return "low";
}

function toExecutionMode(m: GrowthFusionAction["executionMode"]): AiAutopilotAction["executionMode"] {
  return m === "manual_only" ? "manual_only" : "approval_required";
}

/**
 * Converts prioritized fusion actions into autopilot-compatible advisory rows (prefixed ids).
 * Returns empty when `FEATURE_GROWTH_FUSION_AUTOPILOT_BRIDGE_V1` is off.
 */
export function buildFusionBackedAutopilotActions(actions: GrowthFusionAction[]): AiAutopilotAction[] {
  if (!growthFusionFlags.growthFusionAutopilotBridgeV1) {
    return [];
  }

  const now = new Date().toISOString();
  return actions.map((a) => ({
    id: `fusion-bridge-${a.id}`,
    title: `[Fusion] ${a.title}`,
    description: a.description,
    source: mapFusionSourceToAutopilot(a.source),
    impact: a.impact,
    confidence: a.confidence,
    priorityScore: a.priorityScore,
    why: a.why,
    signalStrength: toSignalStrength(a.priorityScore),
    executionMode: toExecutionMode(a.executionMode),
    createdAt: now,
    actionType: "advisory_snapshot",
  }));
}
