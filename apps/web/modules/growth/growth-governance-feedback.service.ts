/**
 * Consolidates governance feedback entries into a bounded advisory summary — no writes.
 */

import type { GrowthGovernanceFeedbackEntry, GrowthGovernanceFeedbackSummary } from "./growth-governance-feedback.types";
import { extractGrowthGovernanceFeedbackEntries, type GrowthGovernanceFeedbackExtractInput } from "./growth-governance-feedback-extractor.service";
import {
  growthGovernanceFeedbackFlags,
  growthGovernanceFlags,
  growthGovernancePolicyFlags,
  growthLearningFlags,
  growthMissionControlFlags,
  growthPolicyEnforcementFlags,
} from "@/config/feature-flags";
import {
  logGrowthGovernanceFeedbackBuildStarted,
  recordGrowthGovernanceFeedbackBuild,
} from "./growth-governance-feedback-monitoring.service";
import { buildGrowthGovernanceFeedbackInsights } from "./growth-governance-feedback-bridge.service";
import { buildGovernancePolicyReviewQueue } from "./growth-governance-feedback-review.service";

const MAX_BUCKET = 6;

function normKey(e: GrowthGovernanceFeedbackEntry): string {
  const t = e.title
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${e.category}|${e.target}|${t}`;
}

function mergeEntries(raw: GrowthGovernanceFeedbackEntry[]): GrowthGovernanceFeedbackEntry[] {
  const map = new Map<string, GrowthGovernanceFeedbackEntry>();
  for (const e of raw) {
    const k = normKey(e);
    const prev = map.get(k);
    const rc = (e.recurrenceCount ?? 1) + (prev?.recurrenceCount ?? 0);
    if (!prev) {
      map.set(k, { ...e, recurrenceCount: rc, lastSeenAt: e.lastSeenAt ?? e.createdAt });
    } else {
      const usefulness =
        e.usefulnessSignal === "too_conservative" || prev.usefulnessSignal === "too_conservative"
          ? "too_conservative"
          : e.usefulnessSignal === "useful" || prev.usefulnessSignal === "useful"
            ? "useful"
            : e.usefulnessSignal === "insufficient_data" || prev.usefulnessSignal === "insufficient_data"
              ? "insufficient_data"
              : "unclear";
      map.set(k, {
        ...prev,
        recurrenceCount: rc,
        rationale: prev.rationale === e.rationale ? prev.rationale : `${prev.rationale} · ${e.rationale}`.slice(0, 480),
        usefulnessSignal: usefulness,
        lastSeenAt: e.lastSeenAt ?? prev.lastSeenAt,
      });
    }
  }
  return [...map.values()];
}

/**
 * Deduplicates and buckets extracted entries into a compact summary.
 */
export function buildGrowthGovernanceFeedbackSummary(entries: GrowthGovernanceFeedbackEntry[]): GrowthGovernanceFeedbackSummary {
  const merged = mergeEntries(entries);
  const createdAt = new Date().toISOString();

  const repeatedFreezePatterns = merged
    .filter((e) => e.category === "freeze")
    .sort((a, b) => (b.recurrenceCount ?? 0) - (a.recurrenceCount ?? 0))
    .slice(0, MAX_BUCKET);

  const repeatedBlockedPatterns = merged
    .filter((e) => e.category === "block")
    .sort((a, b) => (b.recurrenceCount ?? 0) - (a.recurrenceCount ?? 0))
    .slice(0, MAX_BUCKET);

  const repeatedUsefulConstraints = merged
    .filter(
      (e) =>
        e.usefulnessSignal === "useful" ||
        ((e.recurrenceCount ?? 0) >= 2 && (e.category === "freeze" || e.category === "approval_required")),
    )
    .sort((a, b) => (b.recurrenceCount ?? 0) - (a.recurrenceCount ?? 0))
    .slice(0, MAX_BUCKET);

  const possibleOverconservativeConstraints = merged
    .filter((e) => e.usefulnessSignal === "too_conservative")
    .concat(
      merged.filter(
        (e) =>
          (e.recurrenceCount ?? 0) >= 3 &&
          e.category === "advisory_only" &&
          e.target.includes("promotion"),
      ),
    )
    .filter((e, i, a) => a.findIndex((x) => normKey(x) === normKey(e)) === i)
    .slice(0, MAX_BUCKET);

  const notes: string[] = [];
  notes.push("Advisory consolidation only — humans decide policy changes.");
  if (merged.length === 0) {
    notes.push("No feedback entries in this build (partial data or quiet signals).");
  }

  return {
    repeatedUsefulConstraints,
    repeatedFreezePatterns,
    repeatedBlockedPatterns,
    possibleOverconservativeConstraints,
    notes: notes.slice(0, 6),
    createdAt,
  };
}

export type BuildGrowthGovernanceFeedbackFromSystemResult = {
  summary: GrowthGovernanceFeedbackSummary;
  insights: ReturnType<typeof buildGrowthGovernanceFeedbackInsights>;
  reviewQueue: ReturnType<typeof buildGovernancePolicyReviewQueue>;
};

/**
 * Loads read-only sources when flags allow and returns summary + insights + review queue.
 */
export async function buildGrowthGovernanceFeedbackFromSystem(): Promise<BuildGrowthGovernanceFeedbackFromSystemResult | null> {
  if (!growthGovernanceFeedbackFlags.growthGovernanceFeedbackV1) {
    return null;
  }

  logGrowthGovernanceFeedbackBuildStarted();
  const missingDataWarnings: string[] = [];
  const observedAt = new Date().toISOString();

  let governance = null;
  if (growthGovernanceFlags.growthGovernanceV1) {
    try {
      const { evaluateGrowthGovernance } = await import("./growth-governance.service");
      governance = await evaluateGrowthGovernance();
    } catch {
      missingDataWarnings.push("governance_unavailable");
    }
  }

  let policySnapshot = null;
  if (growthGovernancePolicyFlags.growthGovernancePolicyV1) {
    try {
      const { buildGrowthGovernancePolicySnapshot } = await import("./growth-governance-policy.service");
      policySnapshot = await buildGrowthGovernancePolicySnapshot();
    } catch {
      missingDataWarnings.push("policy_unavailable");
    }
  }

  let enforcementSnapshot = null;
  if (growthPolicyEnforcementFlags.growthPolicyEnforcementV1) {
    try {
      const { buildGrowthPolicyEnforcementSnapshot } = await import("./growth-policy-enforcement.service");
      enforcementSnapshot = await buildGrowthPolicyEnforcementSnapshot();
    } catch {
      missingDataWarnings.push("enforcement_unavailable");
    }
  }

  let learningControl = null;
  if (growthLearningFlags.growthLearningV1) {
    try {
      const { getGrowthLearningReadOnlyForCadence } = await import("./growth-learning.service");
      const lr = await getGrowthLearningReadOnlyForCadence();
      learningControl = lr?.learningControl ?? null;
    } catch {
      missingDataWarnings.push("learning_unavailable");
    }
  }

  let missionHumanReviewQueueLength = 0;
  if (growthMissionControlFlags.growthMissionControlV1) {
    try {
      const { buildGrowthMissionControlSummary } = await import("./growth-mission-control.service");
      const m = await buildGrowthMissionControlSummary();
      missionHumanReviewQueueLength = m?.humanReviewQueue.length ?? 0;
    } catch {
      missingDataWarnings.push("mission_control_unavailable");
    }
  }

  const extractInput: GrowthGovernanceFeedbackExtractInput = {
    governance,
    policySnapshot,
    enforcementSnapshot,
    learningControl,
    missionHumanReviewQueueLength,
    decisionJournalReflections: [],
    observedAt,
  };

  const rawEntries = extractGrowthGovernanceFeedbackEntries(extractInput);
  const summary = buildGrowthGovernanceFeedbackSummary(rawEntries);

  if (missingDataWarnings.length) {
    summary.notes = [
      `Partial inputs: ${missingDataWarnings.slice(0, 4).join("; ")}`,
      ...summary.notes,
    ].slice(0, 8);
  }

  const insights = buildGrowthGovernanceFeedbackInsights(summary);
  const reviewQueue = buildGovernancePolicyReviewQueue(summary);

  recordGrowthGovernanceFeedbackBuild({
    extractedCount: rawEntries.length,
    usefulCount: summary.repeatedUsefulConstraints.length,
    freezeCount: summary.repeatedFreezePatterns.length,
    blockedCount: summary.repeatedBlockedPatterns.length,
    overconservativeCount: summary.possibleOverconservativeConstraints.length,
    reviewQueueCount: reviewQueue.length,
    insightCount: insights.length,
    missingDataWarningCount: missingDataWarnings.length,
  });

  return { summary, insights, reviewQueue };
}
