/**
 * Conservative outcome hints — same-build-pass signals only; no invented facts.
 */

import type {
  GrowthDecisionJournalEntry,
  GrowthDecisionJournalOutcome,
  GrowthDecisionJournalReflection,
  GrowthDecisionJournalReflectionSignals,
} from "./growth-decision-journal.types";

const MAX_REFLECTIONS = 14;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Links a subset of entries to advisory outcomes using current snapshot signals only.
 */
export function buildGrowthDecisionJournalReflections(
  entries: GrowthDecisionJournalEntry[],
  signals: GrowthDecisionJournalReflectionSignals,
): GrowthDecisionJournalReflection[] {
  const out: GrowthDecisionJournalReflection[] = [];
  const observedAt = new Date().toISOString();

  const push = (entryId: string, outcome: GrowthDecisionJournalOutcome, rationale: string) => {
    if (out.length >= MAX_REFLECTIONS) return;
    if (out.some((r) => r.entryId === entryId)) return;
    out.push({
      entryId,
      outcome,
      rationale: rationale.slice(0, 320),
      observedAt,
    });
  };

  for (const e of entries) {
    if (out.length >= MAX_REFLECTIONS) break;

    if (e.decision === "executed" && e.source === "autopilot") {
      push(
        e.id,
        "positive",
        "Autopilot row shows a recorded execution in the advisory layer — not a business outcome guarantee.",
      );
      continue;
    }

    if (e.decision === "rejected" && e.source === "autopilot") {
      push(
        e.id,
        "insufficient_data",
        "Rejection logged; longitudinal impact is not tracked in v1 journal (no persistence).",
      );
      continue;
    }

    if (e.decision === "deferred" && e.source === "simulation" && signals.adsPerformance === "WEAK") {
      push(
        e.id,
        "negative",
        "Simulation suggested defer/caution while ads/early funnel band is weak in the current executive snapshot (correlation advisory only).",
      );
      continue;
    }

    if (
      e.source === "strategy" &&
      e.tags?.includes("conversion") &&
      e.decision === "recommended" &&
      signals.adsPerformance === "WEAK"
    ) {
      push(
        e.id,
        "neutral",
        "Conversion-themed strategy priority coexists with weak funnel band — validate before scaling (advisory).",
      );
      continue;
    }

    if (
      e.decision === "review_required" &&
      e.source === "governance" &&
      (signals.governanceStatus === "human_review_required" || signals.governanceStatus === "freeze_recommended")
    ) {
      push(e.id, "neutral", "Governance review posture remains active in the current snapshot (advisory alignment).");
      continue;
    }

    if (norm(e.title).includes("follow") && e.source === "executive" && signals.hotLeads >= 3) {
      push(
        e.id,
        "positive",
        "Follow-up oriented priority appears while hot lead inventory is non-zero (advisory alignment, not causal proof).",
      );
      continue;
    }

    if (e.decision === "deferred" && e.tags?.includes("blocker") && signals.missionStatus === "weak") {
      push(
        e.id,
        "negative",
        "Deferred blockers listed while Mission Control status is weak — triage sequencing (advisory).",
      );
      continue;
    }
  }

  return out;
}
