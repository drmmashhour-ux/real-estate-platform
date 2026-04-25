/**
 * Broker offer-strategy copilot: suggestions and coaching only — not legal, tax, or financing advice, and no auto submission.
 */

export type OfferPostureStyle = "soft_explore" | "guided_offer_discussion" | "confident_offer_push" | "hold_and_nurture";

export type OfferStrategyContext = {
  dealId?: string;
  leadId?: string | null;
  conversationId?: string | null;
  brokerId?: string | null;
  clientId?: string | null;
  /** From deal-closer or another readiness pass when available. */
  closingReadinessScore?: number | null;
  dealProbability?: number | null;
  /** From deal-closer / call pipeline when available; opaque to offer engine. */
  callAnalysis?: unknown;
  visitCompleted?: boolean;
  visitScheduled?: boolean;
  offerDiscussed?: boolean;
  financingReadiness?: "unknown" | "weak" | "medium" | "strong";
  urgencyLevel?: "low" | "medium" | "high";
  objections?: unknown;
  clientMemory?: unknown;
  silenceGapDays?: number | null;
  engagementScore?: number | null;
  competitiveSignals?: {
    mentionedOtherProperties?: boolean;
    mentionedOtherOffers?: boolean;
    delayedDecision?: boolean;
  };
  priceSensitivity?: "low" | "medium" | "high" | "unknown";
  trustLevel?: "low" | "medium" | "high" | "unknown";
  /** Heuristic: hesitation or comparison from messaging insights. */
  hesitationOrComparisonHint?: boolean;
  dealStatus?: string | null;
};

export type OfferReadinessResult = {
  score: number;
  label: "not_ready" | "discussion_ready" | "offer_ready" | "high_offer_intent";
  rationale: string[];
};

export type OfferPosture = {
  style: OfferPostureStyle;
  rationale: string[];
  warnings: string[];
};

export type OfferBlocker = {
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
  rationale: string[];
};

export type CompetitiveOfferRisk = {
  level: "low" | "medium" | "high";
  rationale: string[];
};

export type OfferActionRecommendation = {
  key: string;
  title: string;
  priority: "low" | "medium" | "high";
  rationale: string[];
  suggestedApproach?: string;
};

export type OfferStrategyReinforcementMeta = {
  topKey: string;
  selectionMode: "exploit" | "explore";
  contextBucket: string;
  adjustedRanking: { strategyKey: string; baseScore: number; adjustedScore: number }[];
  rationale: string[];
  decisionId: string | null;
};

export type OfferStrategyOutput = {
  readiness: OfferReadinessResult;
  posture: OfferPosture;
  blockers: OfferBlocker[];
  competitiveRisk: CompetitiveOfferRisk;
  recommendations: OfferActionRecommendation[];
  coachNotes: string[];
  /** Optional contextual bandit layer — ranking only; no auto-exec. */
  reinforcement?: OfferStrategyReinforcementMeta;
};
