/**
 * AI Operator decision log – every agent decision is stored with full explainability.
 */
export type AgentType =
  | "listing_moderation"
  | "pricing"
  | "fraud_risk"
  | "booking_integrity"
  | "demand_forecast"
  | "host_performance"
  | "support_triage"
  | "marketplace_health";

export type AiOperatorDecision = {
  id: string;
  agentType: AgentType;
  entityType: string;
  entityId: string;
  inputSummary: Record<string, unknown>;
  outputSummary: Record<string, unknown>;
  confidenceScore: number;
  recommendedAction: string;
  reasonCodes: string[];
  automatedAction: string | null;
  humanOverride: HumanOverride | null;
  createdAt: string;
};

export type HumanOverride = {
  overrideBy: string;
  overrideAt: string;
  originalAction: string;
  newAction: string;
  notes?: string;
};
