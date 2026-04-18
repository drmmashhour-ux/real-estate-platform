/**
 * Growth Memory — advisory, bounded recall; no source-of-truth writes.
 */

export type GrowthMemoryCategory =
  | "blocker"
  | "winning_pattern"
  | "campaign_lesson"
  | "followup_lesson"
  | "operator_preference"
  | "governance_lesson";

export type GrowthMemorySource =
  | "governance"
  | "executive"
  | "strategy"
  | "agents"
  | "autopilot"
  | "response_desk"
  | "simulation"
  | "mission_control"
  | "manual";

export type GrowthMemoryEntry = {
  id: string;
  category: GrowthMemoryCategory;
  title: string;
  detail: string;
  source: GrowthMemorySource;
  confidence: number;
  recurrenceCount?: number;
  lastSeenAt?: string;
  tags?: string[];
  createdAt: string;
};

export type GrowthMemorySummary = {
  recurringBlockers: GrowthMemoryEntry[];
  winningPatterns: GrowthMemoryEntry[];
  campaignLessons: GrowthMemoryEntry[];
  followupLessons: GrowthMemoryEntry[];
  governanceLessons: GrowthMemoryEntry[];
  operatorPreferences: GrowthMemoryEntry[];
  notes: string[];
  createdAt: string;
};

/** Read-only inputs for extraction — no mutations. */
export type GrowthMemoryExtractorContext = {
  executive: import("./growth-executive.types").GrowthExecutiveSummary | null;
  governance: import("./growth-governance.types").GrowthGovernanceDecision | null;
  strategyBundle: import("./growth-strategy.types").GrowthStrategyBundle | null;
  coordination: import("./growth-agents.types").GrowthAgentCoordinationResult | null;
  simulationBundle: import("./growth-simulation.types").GrowthSimulationBundle | null;
  responseDesk: import("./growth-cadence-response-desk.loader").ResponseDeskCadenceHint | null;
  adsHealth: "WEAK" | "OK" | "STRONG";
  topUtmCampaign?: string;
  leadsToday: number;
  autopilotRejected: number;
  autopilotPending: number;
  autopilotManualOnly: number;
  missingDataWarnings: string[];
  /** Optional digest from Mission Control (or tests) — avoids circular imports in default builds. */
  missionControlDigest?: {
    topRiskTitles: string[];
    humanReviewTitles: string[];
  };
};
