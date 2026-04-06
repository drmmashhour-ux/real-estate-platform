import type { AgentKey, DecisionMode } from "../types";

export type AgentObservation = {
  summary: string;
  signals: Record<string, unknown>;
};

export type AgentPlanStep = {
  id: string;
  toolKey: string;
  description: string;
};

export type AgentActionProposal = {
  actionKey: string;
  label: string;
  requiresApproval: boolean;
  payload?: Record<string, unknown>;
};

export type AgentOutcomeSummary = {
  summary: string;
  confidence: number;
  executedKeys: string[];
  blockedKeys: string[];
};

export type AgentRunInput = {
  userId: string;
  role: string;
  decisionMode: DecisionMode;
  listingId?: string;
  bookingId?: string;
};

export type LecipmAgentContract = {
  key: AgentKey;
  observe(input: AgentRunInput): Promise<AgentObservation>;
  diagnose(obs: AgentObservation): Promise<{ issues: string[] }>;
  plan(issues: string[]): Promise<AgentPlanStep[]>;
  proposeActions(steps: AgentPlanStep[]): Promise<AgentActionProposal[]>;
  executeAllowedActions(
    proposals: AgentActionProposal[],
    input: AgentRunInput
  ): Promise<{ ok: boolean; results: unknown[] }>;
  summarizeOutcome(
    proposals: AgentActionProposal[],
    results: unknown[]
  ): Promise<AgentOutcomeSummary>;
};
