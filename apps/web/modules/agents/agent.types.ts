/**
 * Multi-agent coordination — domain specialists produce advisory decisions only.
 * Execution always goes through policy gates + human approval + proposal queues (no direct production mutation).
 */

export enum AgentType {
  PRICING_AGENT = "PRICING_AGENT",
  RANKING_AGENT = "RANKING_AGENT",
  MESSAGING_AGENT = "MESSAGING_AGENT",
  ESG_AGENT = "ESG_AGENT",
  DEAL_AGENT = "DEAL_AGENT",
}

export type AgentDecision = {
  agentType: AgentType;
  entityId: string;
  entityKind: "listing" | "deal" | "conversation";
  decisionType: string;
  payload: Record<string, unknown>;
  /** Bounded 0–1 — capped per agent to limit runaway influence */
  confidence: number;
  reasoning: string;
};

export type AgentConflict = {
  id: string;
  summary: string;
  agentTypes: AgentType[];
};

export type ProposedAction = {
  agentType: AgentType;
  kind: string;
  payload: Record<string, unknown>;
  confidence: number;
  reasoning: string;
};

export type AggregatedDecision = {
  actions: ProposedAction[];
  conflicts: AgentConflict[];
  /** Mean confidence of non-conflicted actions, else 0 */
  confidenceScore: number;
};

export type PolicyGateResult = {
  allowed: boolean;
  requiresHumanApproval: boolean;
  blocked: boolean;
  policyResults: import("@/modules/growth/policy/growth-policy.types").GrowthPolicyResult[];
};

export type CoordinationRunResult = {
  entityKind: "listing" | "deal" | "conversation";
  entityId: string;
  decisions: AgentDecision[];
  aggregated: AggregatedDecision;
  policy: PolicyGateResult;
  enqueuedTaskIds: string[];
  orchestratorVersion: string;
};

export const COORDINATION_ORCHESTRATOR_VERSION = "lecipm-coord-v1";

/** Hard cap on automated influence (per decision confidence). */
export const MAX_AGENT_CONFIDENCE = 0.92;
