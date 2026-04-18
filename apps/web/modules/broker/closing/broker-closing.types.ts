/**
 * Broker closing V1 — lifecycle tracking for CRM leads (advisory; feature-flagged).
 */

export type LeadClosingStage =
  | "new"
  | "contacted"
  | "responded"
  | "meeting_scheduled"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type LeadClosingState = {
  leadId: string;
  brokerId: string;
  stage: LeadClosingStage;
  lastContactAt?: string;
  responseReceived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadFollowUpSuggestion = {
  id: string;
  type: "first_contact" | "follow_up" | "meeting_push" | "revive_lead";
  title: string;
  description: string;
  urgency: "low" | "medium" | "high";
};

export type ResponseSpeedLabel = "fast" | "average" | "slow";

/** Persisted under `Lead.aiExplanation.brokerClosingV1` (additive JSON). */
export type PersistedBrokerClosingV1 = {
  version: 1;
  stage: LeadClosingStage;
  responseReceived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
