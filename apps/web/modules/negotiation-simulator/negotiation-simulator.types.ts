/**
 * Scenario-based negotiation simulation — not predictions, not legal or financial advice, no auto actions.
 */

import type { OfferPostureStyle } from "@/modules/offer-strategy/offer-strategy.types";

/** Posture from offer-strategy; same as broker-facing offer discussion modes (suggestion-only). */
export type NegotiationPosture = OfferPostureStyle;

export type NegotiationApproachKey =
  | "soft_follow_up"
  | "firm_follow_up"
  | "value_reinforcement"
  | "objection_first"
  | "timing_pause"
  | "visit_push"
  | "offer_discussion_now";

export type NegotiationSimulatorContext = {
  dealId?: string;
  leadId?: string | null;
  conversationId?: string | null;
  brokerId?: string | null;
  clientId?: string | null;
  closingReadinessScore?: number | null;
  offerReadinessScore?: number | null;
  /** Optional deal win probability 0–1 from CRM / heuristics; descriptive only, not a guarantee. */
  dealProbability?: number | null;
  posture?: NegotiationPosture | null;
  blockers?: unknown;
  objections?: unknown;
  competitiveRisk?: "low" | "medium" | "high" | null;
  urgencyLevel?: "low" | "medium" | "high" | null;
  financingReadiness?: "unknown" | "weak" | "medium" | "strong";
  engagementScore?: number | null;
  silenceGapDays?: number | null;
  trustLevel?: "low" | "medium" | "high" | "unknown";
  visitCompleted?: boolean;
  offerDiscussed?: boolean;
  /** Opaque: CRM / deal-closer / optional call pipeline blobs; simulation reads only high-level heuristics when structured. */
  clientMemory?: unknown;
  /** Optional: last call analysis object when the deal thread has a linked call pipeline (suggestion context only). */
  callAnalysis?: unknown;
  priceSensitivity?: "low" | "medium" | "high" | "unknown";
  /** Heuristic: postponed or later language. */
  postponementHint?: boolean;
};

export type NegotiationApproach = {
  key: NegotiationApproachKey;
  title: string;
  description: string;
};

export type NegotiationScenario = {
  approachKey: string;
  expectedOutcome: "positive_progress" | "neutral_progress" | "stall_risk" | "pushback_risk";
  /** 0–1, capped — not a guarantee. */
  confidence: number;
  rationale: string[];
  likelyNextStep: string;
  likelyObjectionPath: string[];
};

export type MomentumRiskResult = {
  level: "low" | "medium" | "high";
  rationale: string[];
};

export type ObjectionPathForecast = {
  likelyObjections: {
    type: string;
    probabilityBand: "low" | "medium" | "high";
    rationale: string[];
  }[];
};

export type NegotiationReinforcementMeta = {
  topKey: string;
  selectionMode: "exploit" | "explore";
  contextBucket: string;
  adjustedRanking: { strategyKey: string; baseScore: number; adjustedScore: number }[];
  rationale: string[];
  decisionId: string | null;
};

export type NegotiationSimulatorOutput = {
  scenarios: NegotiationScenario[];
  safestApproach: string | null;
  highestUpsideApproach: string | null;
  momentumRisk: MomentumRiskResult;
  objectionForecast: ObjectionPathForecast;
  coachNotes: string[];
  /** Optional bandit re-rank; does not change scenario content, only optional ordered view in API. */
  reinforcement?: NegotiationReinforcementMeta;
};
