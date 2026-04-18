/**
 * Growth Executive Panel — company-level read-only snapshot (advisory).
 */

import type { AiAutopilotActionWithStatus } from "./ai-autopilot.types";
import type { GrowthFusionAction } from "./growth-fusion.types";
import type { GrowthGovernanceDecision } from "./growth-governance.types";

export type GrowthExecutiveStatus = "weak" | "watch" | "healthy" | "strong";

export type GrowthExecutivePrioritySource =
  | "fusion"
  | "governance"
  | "autopilot"
  | "ads"
  | "leads"
  | "cro";

export type GrowthExecutivePriority = {
  id: string;
  title: string;
  source: GrowthExecutivePrioritySource;
  impact: "low" | "medium" | "high";
  confidence?: number;
  priorityScore?: number;
  why: string;
};

export type GrowthExecutiveAdsPerformanceBand = "WEAK" | "OK" | "STRONG";

export type GrowthExecutiveSummary = {
  status: GrowthExecutiveStatus;
  topPriority?: string;
  topPriorities: GrowthExecutivePriority[];
  topRisks: string[];
  campaignSummary: {
    totalCampaigns: number;
    topCampaign?: string;
    adsPerformance: GrowthExecutiveAdsPerformanceBand;
  };
  leadSummary: {
    totalLeads: number;
    hotLeads: number;
    dueNow?: number;
  };
  governance?: {
    status: string;
    frozenDomains: string[];
    blockedDomains: string[];
  };
  autopilot?: {
    focusTitle?: string;
    status?: string;
    topActionCount: number;
  };
  createdAt: string;
};

/** Input for priority ordering — immutable snapshots only. */
export type GrowthExecutivePriorityInput = {
  governanceDecision: GrowthGovernanceDecision | null;
  fusionActions: GrowthFusionAction[];
  autopilotActions: AiAutopilotActionWithStatus[];
  adsProblemLines: string[];
  leadsToday: number;
  hotLeadCount: number;
  dueNowCount: number;
  fusionTopProblems: string[];
};
