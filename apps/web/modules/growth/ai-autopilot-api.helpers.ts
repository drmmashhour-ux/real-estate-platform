import {
  buildAutopilotBundleFromSnapshot,
  buildGrowthUnifiedSnapshot,
} from "./ai-autopilot.service";
import { buildPaidFunnelAutopilotActions } from "./growth-ai-actions.service";
import { buildSafeLeadAutopilotActions } from "./ai-autopilot-safe-lead-actions.builder";
import { buildScaleAutopilotManualSuggestions } from "./ai-autopilot-scale-suggestions.builder";
import { build100kGrowthOrchestratorTopActions } from "./ai-growth-orchestrator-100k.builder";
import { build1mGlobalStrategicActions } from "./ai-global-decision-1m.builder";
import { aiGrowthAutopilotSafeFlags, engineFlags } from "@/config/feature-flags";
import { getAutopilotActionStatus } from "./ai-autopilot-approval.service";
import { getAutopilotExecutionRecord } from "./ai-autopilot-execution-state.service";
import type { AiAutopilotAction, AiAutopilotActionWithStatus, AiAutopilotSignalStrength } from "./ai-autopilot.types";

export type AutopilotPanelPayload = {
  actions: AiAutopilotActionWithStatus[];
  autopilotStatus: "healthy" | "attention";
  grouped: {
    ads: AiAutopilotActionWithStatus[];
    cro: AiAutopilotActionWithStatus[];
    leads: AiAutopilotActionWithStatus[];
  };
  focusTitle: string | null;
  panelSignalStrength: AiAutopilotSignalStrength;
};

function attachStatus(actions: AiAutopilotAction[]): AiAutopilotActionWithStatus[] {
  return actions.map((a) => {
    const exec = getAutopilotExecutionRecord(a.id);
    const executionStatus = exec?.executionStatus ?? "none";
    return {
      ...a,
      status: getAutopilotActionStatus(a.id),
      executionStatus,
      executionError: exec?.executionStatus === "failed" ? exec.executionNotes : undefined,
    };
  });
}

function groupBySourceWithStatus(
  actions: AiAutopilotActionWithStatus[],
): AutopilotPanelPayload["grouped"] {
  const g = {
    ads: [] as AiAutopilotActionWithStatus[],
    cro: [] as AiAutopilotActionWithStatus[],
    leads: [] as AiAutopilotActionWithStatus[],
  };
  for (const a of actions) {
    g[a.source].push(a);
  }
  const sortDesc = (arr: AiAutopilotActionWithStatus[]) =>
    arr.sort((x, y) => y.priorityScore - x.priorityScore);
  sortDesc(g.ads);
  sortDesc(g.cro);
  sortDesc(g.leads);
  return g;
}

export async function listAutopilotActionsWithStatus(): Promise<AutopilotPanelPayload> {
  const snapshot = buildGrowthUnifiedSnapshot();
  const bundle = buildAutopilotBundleFromSnapshot(snapshot);
  const paid = await buildPaidFunnelAutopilotActions();

  const advisoryCombined = [...bundle.actions, ...paid]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  const safe = await buildSafeLeadAutopilotActions();
  const scale =
    engineFlags.growthScaleV1 && aiGrowthAutopilotSafeFlags.aiAutopilotV1
      ? await buildScaleAutopilotManualSuggestions()
      : [];
  const orchestrator100k =
    engineFlags.growth100kV1 && aiGrowthAutopilotSafeFlags.aiAutopilotV1
      ? await build100kGrowthOrchestratorTopActions(3)
      : [];
  const orchestrator1m =
    engineFlags.growth1mV1 && aiGrowthAutopilotSafeFlags.aiAutopilotV1
      ? await build1mGlobalStrategicActions(5)
      : [];
  const merged = [...advisoryCombined, ...safe, ...scale, ...orchestrator100k, ...orchestrator1m];
  const actions = attachStatus(merged);

  const autopilotStatus =
    bundle.status === "healthy" && paid.length === 0 ? "healthy" : "attention";

  const focusTitle = advisoryCombined[0]?.title ?? null;

  return {
    actions,
    autopilotStatus,
    grouped: groupBySourceWithStatus(actions),
    focusTitle,
    panelSignalStrength: bundle.panelSignalStrength,
  };
}
