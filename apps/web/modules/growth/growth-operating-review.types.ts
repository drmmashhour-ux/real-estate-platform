/**
 * Weekly operating review — advisory synthesis only; no execution or source mutations.
 */

import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";
import type { GrowthMemorySummary } from "./growth-memory.types";
import type { GrowthPolicyEnforcementSnapshot } from "./growth-policy-enforcement.types";
import type { GrowthSimulationBundle } from "./growth-simulation.types";
import type { GrowthStrategyBundle } from "./growth-strategy.types";
import type { GrowthAgentCoordinationResult } from "./growth-agents.types";

export type GrowthOperatingReviewStatus = "weak" | "watch" | "healthy" | "strong";

export type GrowthOperatingReviewItemCategory =
  | "worked"
  | "didnt_work"
  | "blocked"
  | "deferred"
  | "change_next_week";

export type GrowthOperatingReviewItemSource =
  | "executive"
  | "governance"
  | "strategy"
  | "agents"
  | "autopilot"
  | "simulation"
  | "journal"
  | "memory";

export type GrowthOperatingReviewItem = {
  id: string;
  category: GrowthOperatingReviewItemCategory;
  title: string;
  detail: string;
  source: GrowthOperatingReviewItemSource;
  severity?: "low" | "medium" | "high";
  createdAt: string;
};

export type GrowthOperatingReviewSummary = {
  weekLabel: string;
  status: GrowthOperatingReviewStatus;
  worked: GrowthOperatingReviewItem[];
  didntWork: GrowthOperatingReviewItem[];
  blocked: GrowthOperatingReviewItem[];
  deferred: GrowthOperatingReviewItem[];
  nextWeekChanges: GrowthOperatingReviewItem[];
  notes: string[];
  createdAt: string;
};

/** Read-only snapshots for aggregation — all optional for partial builds. */
export type GrowthOperatingReviewBuildInput = {
  weekLabel: string;
  createdAt: string;
  executive: GrowthExecutiveSummary | null;
  dailyBrief: GrowthDailyBrief | null;
  strategyBundle: GrowthStrategyBundle | null;
  governance: GrowthGovernanceDecision | null;
  simulationBundle: GrowthSimulationBundle | null;
  memorySummary: GrowthMemorySummary | null;
  agentCoordination: GrowthAgentCoordinationResult | null;
  enforcementSnapshot: GrowthPolicyEnforcementSnapshot | null;
  journalReflections: string[];
  autopilot: { pending: number; rejected: number; approved: number };
  followUp: { dueNow: number; highIntentQueued: number };
  learningControlFreezeRecommended: boolean;
  missingDataWarnings: string[];
};
