/**
 * Growth Decision Journal — advisory normalization of recommendations vs human posture vs outcomes (read-only).
 */

export type GrowthDecisionJournalSource =
  | "fusion"
  | "executive"
  | "daily_brief"
  | "governance"
  | "strategy"
  | "agents"
  | "autopilot"
  | "simulation"
  | "manual";

export type GrowthDecisionJournalDecision =
  | "recommended"
  | "approved"
  | "rejected"
  | "executed"
  | "deferred"
  | "review_required";

export type GrowthDecisionJournalOutcome =
  | "positive"
  | "negative"
  | "neutral"
  | "unknown"
  | "insufficient_data";

export type GrowthDecisionJournalEntry = {
  id: string;
  source: GrowthDecisionJournalSource;
  title: string;
  summary: string;
  decision: GrowthDecisionJournalDecision;
  why?: string;
  linkedActionId?: string;
  linkedEntityId?: string;
  tags?: string[];
  createdAt: string;
};

export type GrowthDecisionJournalReflection = {
  entryId: string;
  outcome: GrowthDecisionJournalOutcome;
  rationale: string;
  observedAt: string;
};

export type GrowthDecisionJournalStats = {
  recommendedCount: number;
  approvedCount: number;
  rejectedCount: number;
  executedCount: number;
  deferredCount: number;
  reviewRequiredCount: number;
  positiveOutcomeCount: number;
  negativeOutcomeCount: number;
  neutralOutcomeCount: number;
};

export type GrowthDecisionJournalSummary = {
  entries: GrowthDecisionJournalEntry[];
  reflections: GrowthDecisionJournalReflection[];
  stats: GrowthDecisionJournalStats;
  createdAt: string;
};

/** Signals for conservative reflection rules — derived from the same read-only build pass. */
export type GrowthDecisionJournalReflectionSignals = {
  adsPerformance: "WEAK" | "OK" | "STRONG";
  governanceStatus: string | null;
  executiveStatus: string | null;
  missionStatus: string | null;
  hotLeads: number;
  dueNow: number;
};
