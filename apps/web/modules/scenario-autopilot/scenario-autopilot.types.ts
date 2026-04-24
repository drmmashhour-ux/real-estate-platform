import type { ScenarioInput, SimulationBaseline, WhatIfResult } from "@/modules/simulation/simulation.types";

export type ScenarioAutopilotDomain =
  | "marketing"
  | "lead_routing"
  | "follow_up_timing"
  | "booking_confirmation"
  | "no_show_reminders"
  | "trust_threshold"
  | "territory_pacing"
  | "broker_prioritization"
  | "content_cadence";

export type ScenarioRiskLevel = "low" | "medium" | "high" | "critical";

/** One generated candidate before/after simulation enrichment. */
export type CandidateScenario = {
  id: string;
  domain: ScenarioAutopilotDomain;
  title: string;
  /** What-if engine parameters (simulation only until execution). */
  parameters: ScenarioInput;
  expectedTargets: string[];
  riskLevel: ScenarioRiskLevel;
  reversible: boolean;
  /** Domains that require human approval tier even if model says low. */
  requiresHighTierApproval: boolean;
  /** 0-1: execution difficulty */
  effortScore: number;
  /** Rationale for generator line (audit) */
  generatorRationale: string;
};

export type EnrichedCandidate = CandidateScenario & {
  simulation: WhatIfResult;
  normalized: NormalizedSimulationOutput;
};

export type NormalizedSimulationOutput = {
  revenueDelta: number;
  conversionDelta: number;
  disputeRiskDelta: number;
  trustImpact: number;
  noShowImpact: number;
  workloadImpact: number;
  operationalComplexity: number;
};

export type ScenarioAutopilotStatus =
  | "GENERATED"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "EXECUTED"
  | "FAILED"
  | "REVERSED";

export type RankingResult = {
  best: EnrichedCandidate;
  topAlternatives: EnrichedCandidate[];
  /** Full sorted set for comparison UIs. */
  all: EnrichedCandidate[];
  /** Human-readable */
  reasonBestWon: string;
  reasonAlternativesLower: string[];
  scores: Array<{ candidateId: string; score: number; breakdown: Record<string, number> }>;
};

export type ApprovalPayload = {
  scenarioSummary: string;
  predictedImpact: NormalizedSimulationOutput;
  riskWarnings: string[];
  explanation: string;
  rollbackAvailable: boolean;
  affectedDomains: ScenarioAutopilotDomain[];
  bestCandidate: EnrichedCandidate;
};

export type ExecutionStep = {
  at: string;
  domain: string;
  action: string;
  result: "ok" | "blocked" | "skipped" | "simulated";
  detail: string;
};

export type OutcomeRecord = {
  windowDays: number;
  baselineBefore: SimulationBaseline;
  resultAfter: SimulationBaseline;
  /** Key metric deltas (real) */
  delta: {
    leads: number;
    conversionPct: number;
    revenueProxyPct: number;
    disputeCount: number;
    trust: number | null;
  };
  didItMatchPrediction: "yes" | "partial" | "no" | "unknown";
  confidence: "low" | "medium" | "high";
  measuredAt: string;
};

export type RollbackEvent = {
  at: string;
  actorUserId: string;
  reason: string;
  reversible: boolean;
  note: string;
};

export type AutopilotRunSummary = {
  id: string;
  status: ScenarioAutopilotStatus;
  bestCandidateTitle: string | null;
  bestRevenueDelta: number | null;
  createdAt: string;
  pendingApproval: boolean;
};
