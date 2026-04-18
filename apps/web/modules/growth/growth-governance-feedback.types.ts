/**
 * Governance + enforcement feedback — advisory memory only; does not change policy or execution.
 */

export type GrowthGovernanceConstraintCategory =
  | "freeze"
  | "block"
  | "approval_required"
  | "advisory_only"
  | "review_required";

export type GrowthGovernanceUsefulnessSignal =
  | "useful"
  | "unclear"
  | "too_conservative"
  | "insufficient_data";

export type GrowthGovernanceFeedbackEntrySource = "governance" | "policy" | "enforcement" | "manual";

export type GrowthGovernanceFeedbackEntry = {
  id: string;
  category: GrowthGovernanceConstraintCategory;
  /** Stable key: domain, enforcement target, or short label. */
  target: string;
  title: string;
  rationale: string;
  recurrenceCount?: number;
  usefulnessSignal?: GrowthGovernanceUsefulnessSignal;
  source: GrowthGovernanceFeedbackEntrySource;
  createdAt: string;
  lastSeenAt?: string;
};

export type GrowthGovernanceFeedbackSummary = {
  repeatedUsefulConstraints: GrowthGovernanceFeedbackEntry[];
  repeatedFreezePatterns: GrowthGovernanceFeedbackEntry[];
  repeatedBlockedPatterns: GrowthGovernanceFeedbackEntry[];
  possibleOverconservativeConstraints: GrowthGovernanceFeedbackEntry[];
  notes: string[];
  createdAt: string;
};

export type GrowthGovernanceFeedbackInsight = {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
};

export type GrowthGovernancePolicyReviewQueueItem = {
  title: string;
  rationale: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
};
