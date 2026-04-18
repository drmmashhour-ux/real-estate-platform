/**
 * Human policy review queue suggestions — advisory only; no rule writes.
 */

import type {
  GrowthGovernanceFeedbackSummary,
  GrowthGovernancePolicyReviewQueueItem,
} from "./growth-governance-feedback.types";

const MAX_QUEUE = 8;

export function buildGovernancePolicyReviewQueue(summary: GrowthGovernanceFeedbackSummary): GrowthGovernancePolicyReviewQueueItem[] {
  const q: GrowthGovernancePolicyReviewQueueItem[] = [];

  for (const e of summary.repeatedFreezePatterns.slice(0, 3)) {
    q.push({
      title: `Review repeated freeze on ${e.target}`,
      rationale: e.rationale,
      severity: (e.recurrenceCount ?? 0) >= 3 ? "high" : "medium",
      recommendation: "Confirm freeze remains appropriate for current acquisition posture (manual decision).",
    });
  }

  for (const e of summary.possibleOverconservativeConstraints.slice(0, 3)) {
    q.push({
      title: `Review whether ${e.target} gating is still appropriate`,
      rationale: e.rationale,
      severity: "medium",
      recommendation: "Validate with recent outcomes before changing policy — no automatic relaxation.",
    });
  }

  for (const e of summary.repeatedBlockedPatterns.slice(0, 2)) {
    q.push({
      title: `Review block pattern: ${e.target}`,
      rationale: e.rationale,
      severity: "low",
      recommendation: "Ensure blocks still align with operator risk tolerance.",
    });
  }

  const dedup = new Map<string, GrowthGovernancePolicyReviewQueueItem>();
  for (const item of q) {
    if (!dedup.has(item.title)) dedup.set(item.title, item);
  }

  return [...dedup.values()].slice(0, MAX_QUEUE);
}
