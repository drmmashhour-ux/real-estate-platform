/**
 * Policy review history — audit trail only; does not mutate live policy evaluation or external state.
 */

import type { GrowthPolicyDomain, GrowthPolicySeverity } from "@/modules/growth/policy/growth-policy.types";

export type GrowthPolicyHistoryStatus = "active" | "inactive" | "recurring" | "resolved_reviewed";

export type GrowthPolicyReviewDecision =
  | "acknowledged"
  | "monitoring"
  | "resolved"
  | "recurring"
  | "false_alarm";

export type GrowthPolicyHistoryEntry = {
  id: string;
  policyId: string;
  domain: GrowthPolicyDomain;
  severity: GrowthPolicySeverity;
  title: string;
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  seenCount: number;
  currentStatus: GrowthPolicyHistoryStatus;
  lastNote?: string;
  lastReviewedAt?: string;
  lastReviewedBy?: string;
};

export type GrowthPolicyReviewRecord = {
  id: string;
  fingerprint: string;
  policyId: string;
  reviewedAt: string;
  reviewedBy?: string;
  reviewDecision: GrowthPolicyReviewDecision;
  note?: string;
};

export type GrowthPolicyHistorySummary = {
  totalHistoricalFindings: number;
  activeRecurringCount: number;
  resolvedReviewedCount: number;
  topRecurringFindings: GrowthPolicyHistoryEntry[];
  recentReviews: GrowthPolicyReviewRecord[];
  generatedAt: string;
};

/** Lightweight hints for the live policy panel (no overwrite of computed policies). */
export type GrowthPolicyHistoryHint = {
  seenCount: number;
  currentStatus: GrowthPolicyHistoryStatus;
  lastReviewDecision?: GrowthPolicyReviewDecision;
  lastNote?: string;
  fingerprint: string;
};
