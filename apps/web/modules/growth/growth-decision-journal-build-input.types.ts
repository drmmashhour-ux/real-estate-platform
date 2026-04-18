/**
 * Internal DTO — journal builders only read these snapshots; they never mutate inputs.
 */

import type { AutopilotPanelPayload } from "./ai-autopilot-api.helpers";
import type { GrowthAgentCoordinationResult } from "./growth-agents.types";
import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthMissionControlSummary } from "./growth-mission-control.types";
import type { GrowthSimulationBundle } from "./growth-simulation.types";
import type { GrowthStrategyBundle } from "./growth-strategy.types";

export type GrowthDecisionJournalBuildInput = {
  autopilot: AutopilotPanelPayload | null;
  executive: GrowthExecutiveSummary | null;
  governance: GrowthGovernanceDecision | null;
  strategyBundle: GrowthStrategyBundle | null;
  simulationBundle: GrowthSimulationBundle | null;
  missionControl: GrowthMissionControlSummary | null;
  dailyBrief: GrowthDailyBrief | null;
  coordination: GrowthAgentCoordinationResult | null;
  missingDataWarnings: string[];
};
