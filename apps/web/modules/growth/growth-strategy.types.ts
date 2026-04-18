/**
 * Growth strategy layer — advisory plans only; no execution.
 */

import type { GrowthAgentCoordinationResult } from "./growth-agents.types";
import type { GrowthDailyBrief } from "./growth-daily-brief.types";
import type { GrowthExecutiveSummary } from "./growth-executive.types";
import type { GrowthFusionSummary } from "./growth-fusion.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";

export type GrowthStrategyHorizon = "this_week" | "next_2_weeks" | "this_month";

export type GrowthStrategyTheme =
  | "acquisition"
  | "conversion"
  | "lead_followup"
  | "content"
  | "governance"
  | "execution"
  | "experimentation";

export type GrowthStrategyPriority = {
  id: string;
  title: string;
  theme: GrowthStrategyTheme;
  impact: "low" | "medium" | "high";
  confidence: number;
  why: string;
  blockers?: string[];
  /** Growth Memory layer — advisory annotations when priority bridge flag is on. */
  memoryAnnotations?: string[];
  /** Small non-binding visibility hint for UI (0–0.12); does not replace strategy scoring. */
  memoryAdvisoryBoost?: number;
};

export type GrowthStrategyExperiment = {
  id: string;
  title: string;
  hypothesis: string;
  successMetric: string;
  scope: "small" | "medium";
  ownerHint?: string;
  why: string;
};

export type GrowthStrategyRoadmapItem = {
  id: string;
  title: string;
  horizon: GrowthStrategyHorizon;
  theme: GrowthStrategyTheme;
  why: string;
  priority: "low" | "medium" | "high";
};

export type GrowthStrategyPlanStatus = "weak" | "watch" | "healthy" | "strong";

export type GrowthStrategyPlan = {
  horizon: GrowthStrategyHorizon;
  status: GrowthStrategyPlanStatus;
  topPriority?: string;
  priorities: GrowthStrategyPriority[];
  experiments: GrowthStrategyExperiment[];
  roadmap: GrowthStrategyRoadmapItem[];
  blockers: string[];
  notes: string[];
  createdAt: string;
};

export type GrowthStrategyBundle = {
  weeklyPlan: GrowthStrategyPlan;
  roadmapSummary: GrowthStrategyRoadmapItem[];
  createdAt: string;
};

/** Read-only inputs assembled for strategy planners — no mutations. */
export type GrowthStrategySourceSnapshot = {
  executive: GrowthExecutiveSummary | null;
  dailyBrief: GrowthDailyBrief | null;
  governance: GrowthGovernanceDecision | null;
  fusionSummary: GrowthFusionSummary | null;
  coordination: GrowthAgentCoordinationResult | null;
  autopilotTopActions: { title: string; priorityScore: number; impact: "low" | "medium" | "high" }[];
  dueNowCount: number;
  hotLeadCount: number;
  leadsTodayEarly: number;
  adsHealth: "WEAK" | "OK" | "STRONG";
  missingDataWarnings: string[];
};
