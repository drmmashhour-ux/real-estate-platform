/**
 * Growth Mission Control — single advisory console; no execution.
 */

import type { GrowthAgentCoordinationResult } from "./growth-agents.types";
import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthLearningControlDecision } from "./growth-governance-learning.types";
import type { GrowthSimulationBundle } from "./growth-simulation.types";
import type { GrowthFusionAction, GrowthFusionSummary } from "./growth-fusion.types";
import type { GrowthStrategyBundle } from "./growth-strategy.types";
import type { ResponseDeskCadenceHint } from "./growth-cadence-response-desk.loader";

export type GrowthMissionControlStatus = "weak" | "watch" | "healthy" | "strong";

export type GrowthMissionControlFocus = {
  title: string;
  source:
    | "fusion"
    | "executive"
    | "daily_brief"
    | "governance"
    | "strategy"
    | "agents"
    | "simulation"
    | "autopilot"
    | "memory"
    | "graph"
    | "journal";
  why: string;
};

export type GrowthMissionControlRisk = {
  title: string;
  severity: "low" | "medium" | "high";
  source: string;
  why: string;
};

export type GrowthMissionControlReviewItem = {
  id: string;
  title: string;
  source: string;
  reason: string;
  severity: "low" | "medium" | "high";
};

export type GrowthMissionControlSummary = {
  status: GrowthMissionControlStatus;
  missionFocus?: GrowthMissionControlFocus;
  todayChecklist: string[];
  topRisks: GrowthMissionControlRisk[];
  strategyFocus?: string;
  simulationRecommendation?: string;
  humanReviewQueue: GrowthMissionControlReviewItem[];
  blockedDomains: string[];
  frozenDomains: string[];
  notes: string[];
  createdAt: string;
};

/**
 * Read-only inputs for assembly — no mutations by consumers.
 * Optional hints / prefetched lines allow callers to inject already-loaded subsystem data (reduces duplicate reads).
 */
export type GrowthMissionControlBuildContext = {
  executive: GrowthExecutiveSummary | null;
  dailyBrief: GrowthDailyBrief | null;
  governance: GrowthGovernanceDecision | null;
  /** From `buildGrowthFusionSystem()` when `FEATURE_GROWTH_FUSION_V1` is on — advisory only. */
  fusion: { summary: GrowthFusionSummary; actions: GrowthFusionAction[] } | null;
  strategyBundle: GrowthStrategyBundle | null;
  coordination: GrowthAgentCoordinationResult | null;
  simulationBundle: GrowthSimulationBundle | null;
  learningControl: GrowthLearningControlDecision | null;
  responseDesk: ResponseDeskCadenceHint | null;
  autopilotFocusTitle: string | null;
  missingDataWarnings: string[];
  /** When stronger operational sources are thin, focus resolver may use these (advisory). */
  memoryFocusHint?: string | null;
  graphFocusHint?: string | null;
  journalFocusHint?: string | null;
  /** When set, `buildGrowthMissionControlSummary` may skip re-fetching memory notes for assembly. */
  prefetchedMemoryNotes?: string[];
  prefetchedGraphInsights?: string[];
  prefetchedJournalInsights?: string[];
};
