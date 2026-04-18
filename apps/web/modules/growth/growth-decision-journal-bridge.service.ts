/**
 * Compact advisory lines for Executive / Mission Control / Learning — non-authoritative.
 */

import type { GrowthDecisionJournalSummary } from "./growth-decision-journal.types";

/**
 * Derives short insight strings from journal stats and reflections (deterministic, bounded).
 */
export function buildGrowthDecisionJournalInsights(summary: GrowthDecisionJournalSummary): string[] {
  const out: string[] = [];
  const { stats, reflections, entries } = summary;

  if (stats.approvedCount > 0 && stats.positiveOutcomeCount > 0) {
    out.push(
      "Some approved or executed items align with positive reflection tags in this snapshot — treat as advisory, not proof.",
    );
  }

  if (stats.deferredCount >= 2 && stats.negativeOutcomeCount >= 1) {
    out.push("Deferred items appear alongside negative reflection hints — review sequencing vs funnel health (advisory).");
  }

  if (stats.rejectedCount >= 1 && stats.reviewRequiredCount >= 2) {
    out.push("Rejected autopilot rows coexist with review-required governance items — backlog may need explicit closure (advisory).");
  }

  if (stats.reviewRequiredCount >= 3 && reflections.some((r) => r.outcome === "neutral")) {
    out.push("Governance or mission review signals are frequent — consider consolidating decisions in standup (advisory).");
  }

  const unknownHeavy = reflections.filter((r) => r.outcome === "insufficient_data").length;
  if (unknownHeavy >= 2) {
    out.push("Several items lack outcome linkage — v1 journal is snapshot-only; persistence would strengthen learning.");
  }

  if (entries.some((e) => e.tags?.includes("missing_data"))) {
    out.push("Partial data warnings were present when building this journal — interpret counts conservatively.");
  }

  return out.slice(0, 6);
}
