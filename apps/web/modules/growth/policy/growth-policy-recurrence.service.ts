/**
 * Derives history status from evaluation visibility + human reviews.
 * Never auto-resolves live policy output — only labels stored history rows.
 */

import type {
  GrowthPolicyHistoryEntry,
  GrowthPolicyHistoryStatus,
  GrowthPolicyReviewDecision,
} from "@/modules/growth/policy/growth-policy-history.types";

/**
 * Rules:
 * - Live policy evaluation remains authoritative; history status is never written back into policy rules.
 * - `active`: appears in current evaluation; first observation (`seenCount < 2`) without prior dormant gap.
 * - `recurring`: appears now AND (`seenCount >= 2` **or** returning after `inactive` / `resolved_reviewed`).
 * - `resolved_reviewed`: does **not** appear now AND latest human review decision is `resolved` (absence ≠ proven fix).
 * - `inactive`: does not appear now AND latest review is not `resolved` (or no review).
 */
export function deriveGrowthPolicyHistoryStatus(params: {
  activeNow: boolean;
  seenCount: number;
  /** Status before applying this evaluation tick (undefined for brand-new fingerprints). */
  priorStatus?: GrowthPolicyHistoryStatus;
  /** Latest review by `reviewedAt`. */
  latestReviewDecision?: GrowthPolicyReviewDecision;
}): GrowthPolicyHistoryStatus {
  const { activeNow, seenCount, priorStatus, latestReviewDecision } = params;

  if (activeNow) {
    const dormantReturn =
      priorStatus === "inactive" || priorStatus === "resolved_reviewed";
    if (dormantReturn) return "recurring";
    if (seenCount >= 2) return "recurring";
    return "active";
  }

  if (latestReviewDecision === "resolved") return "resolved_reviewed";
  return "inactive";
}

export function withHistoryStatus(
  entry: GrowthPolicyHistoryEntry,
  status: GrowthPolicyHistoryStatus,
): GrowthPolicyHistoryEntry {
  return { ...entry, currentStatus: status };
}
