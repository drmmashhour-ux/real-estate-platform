/**
 * Applies bounded learning-only adjustments: ordering metadata and optional soft-hide of advisory rows.
 * Never changes enforcement outcomes, disposition for blocked/review rows, or catalog membership.
 */

import {
  isGrowthAutonomyPrefilledDisposition,
  type GrowthAutonomyDisposition,
  type GrowthAutonomySnapshot,
  type GrowthAutonomySuggestion,
} from "./growth-autonomy.types";

function dispositionTier(d: GrowthAutonomyDisposition): number {
  switch (d) {
    case "blocked":
      return 5;
    case "approval_required":
      return 4;
    case "suggest_only":
    case "prefilled_action":
      return 3;
    case "hidden":
      return 1;
    default:
      return 2;
  }
}

export type GrowthAutonomyLearningApplyInput = {
  suggestions: GrowthAutonomySuggestion[];
  counts: GrowthAutonomySnapshot["counts"];
  weightDeltasByCategory: Record<string, number>;
  suppressedUntilByCategory: Record<string, number>;
  learningActive: boolean;
};

export function applyGrowthAutonomyLearning(args: GrowthAutonomyLearningApplyInput): {
  suggestions: GrowthAutonomySuggestion[];
  counts: GrowthAutonomySnapshot["counts"];
} {
  if (!args.learningActive) {
    return { suggestions: args.suggestions.map((s) => ({ ...s })), counts: { ...args.counts } };
  }

  const now = Date.now();
  let surfaced = args.counts.surfaced;
  let hidden = args.counts.hidden;
  let prefilled = args.counts.prefilled;

  const processed = args.suggestions.map((s) => {
    const dup = { ...s };
    const delta = args.weightDeltasByCategory[s.id] ?? 0;
    const until = args.suppressedUntilByCategory[s.id] ?? 0;
    const suppressed = until > now;
    dup.learningRankScore = dup.confidence + delta;
    dup.learningNote =
      suppressed && (dup.disposition === "suggest_only" || dup.disposition === "prefilled_action") ?
        "Learning loop temporarily reduced visibility — not a policy block."
      : delta !== 0 ?
        `Ordering bias ${delta >= 0 ? "+" : ""}${delta.toFixed(3)} from observed engagement (bounded).`
      : null;

    if (
      suppressed &&
      (dup.disposition === "suggest_only" || isGrowthAutonomyPrefilledDisposition(dup.disposition))
    ) {
      if (dup.disposition !== "hidden") {
        surfaced = Math.max(0, surfaced - 1);
        hidden += 1;
        if (isGrowthAutonomyPrefilledDisposition(dup.disposition)) prefilled = Math.max(0, prefilled - 1);
      }
      dup.disposition = "hidden";
      dup.allowed = false;
      dup.prefill = undefined;
    }

    return dup;
  });

  processed.sort((a, b) => {
    const dt = dispositionTier(b.disposition) - dispositionTier(a.disposition);
    if (dt !== 0) return dt;
    return (b.learningRankScore ?? b.confidence) - (a.learningRankScore ?? a.confidence);
  });

  return {
    suggestions: processed,
    counts: {
      ...args.counts,
      surfaced,
      hidden,
      prefilled,
    },
  };
}
