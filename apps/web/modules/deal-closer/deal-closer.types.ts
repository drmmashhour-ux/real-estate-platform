/**
 * Broker-side deal closer copilot — suggestions only, no auto-send, no legal/financial advice.
 */

export type DealCloserStage = "explore" | "qualify" | "visit" | "offer" | "close" | "stalled" | "unknown";

export type DealCloserContext = {
  dealId?: string;
  conversationId?: string | null;
  leadId?: string | null;
  brokerId?: string | null;
  clientId?: string | null;
  dealStage?: string | null;
  /** Free-form prior insights (e.g. messaging/call) — explainable snippets only. */
  conversationInsights?: unknown;
  /** Objection classifier output or plain list of concern tags. */
  objections?: unknown;
  callAnalysis?: unknown;
  clientMemory?: unknown;
  engagementScore?: number | null;
  dealProbability?: number | null;
  /** Product-only workflow hint, not a credit decision. */
  financingReadiness?: "unknown" | "weak" | "medium" | "strong";
  urgencyLevel?: "low" | "medium" | "high";
  visitScheduled?: boolean;
  offerDiscussed?: boolean;
  silenceGapDays?: number | null;
  /** Optional deal status from CRM (e.g. initiated, financing, closing_scheduled). */
  dealStatus?: string | null;
  crmStage?: string | null;
};

export type ClosingReadinessResult = {
  score: number;
  label: "not_ready" | "warming_up" | "close_ready" | "high_intent";
  rationale: string[];
};

export type CloseBlocker = {
  key: string;
  label: string;
  severity: "low" | "medium" | "high";
  rationale: string[];
};

export type NextCloseAction = {
  key: string;
  title: string;
  priority: "low" | "medium" | "high";
  rationale: string[];
  suggestedApproach?: string;
  suggestedMessageGoal?: string;
  /** Blocker keys that would make this action a poor fit if still open. */
  blockedIf?: string[];
};

export type DealCloserReinforcementMeta = {
  topKey: string;
  selectionMode: "exploit" | "explore";
  contextBucket: string;
  adjustedRanking: { strategyKey: string; baseScore: number; adjustedScore: number }[];
  rationale: string[];
  decisionId: string | null;
};

export type DealCloserOutput = {
  readiness: ClosingReadinessResult;
  blockers: CloseBlocker[];
  nextActions: NextCloseAction[];
  prematurePushRisk: "low" | "medium" | "high";
  closeStrategy: string[];
  coachNotes: string[];
  reinforcement?: DealCloserReinforcementMeta;
};
