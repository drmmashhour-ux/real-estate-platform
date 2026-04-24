import type { LecipmDisputePredictedCategory } from "@prisma/client";

import type {
  DisputePredictionExplainabilityPayload,
  DisputePredictionResult,
  DisputePredictionSourceMix,
} from "./dispute-prediction.types";

const SAFETY =
  "Advisory probabilistic scoring only — not legal fault, certainty, or guaranteed outcomes. No punitive automation.";

export function buildDisputePredictionExplainability(input: {
  result: DisputePredictionResult;
  sourceMix: DisputePredictionSourceMix;
  matchedPatternSummaries?: string[];
}): DisputePredictionExplainabilityPayload {
  const whyElevated = input.result.topContributingSignals.slice(0, 6).map(
    (s) => `${s.id}: ${s.evidence.slice(0, 240)}`
  );

  const recommendedActions = input.result.suggestedPreventionActions.map((a) => `${a.kind} — ${a.detail}`);

  const patternLearningNote =
    input.sourceMix === "rules_only" ?
      "Recommendation driven by deterministic operational signals."
    : input.matchedPatternSummaries?.length ?
      `Historical pattern hints: ${input.matchedPatternSummaries.slice(0, 4).join("; ")}`
    : input.sourceMix === "patterns_only" ?
      "Weighted toward learned correlations from historical dispute openings (sample-size dependent)."
    : "Blends live signals with lightweight learned pattern correlations where available.";

  return {
    topContributingSignals: input.result.topContributingSignals,
    whyElevated,
    recommendedActions,
    confidenceNote: `Risk band ${input.result.riskBand}; score ${input.result.disputeRiskScore}/100. Category guess: ${input.result.predictedCategory} (probabilistic label).`,
    patternLearningNote,
    safetyFooter: SAFETY,
  };
}

export function summarizeCategoryForHumans(cat: LecipmDisputePredictedCategory): string {
  const labels: Partial<Record<LecipmDisputePredictedCategory, string>> = {
    NO_SHOW_CONFLICT: "Friction around timing / confirmations / itinerary clarity",
    PAYMENT_FRICTION: "Settlement or payment-timing tension risk",
    MISLEADING_EXPECTATION: "Mismatch between expectations and listing communication",
    RESPONSE_DELAY_CONFLICT: "Stale communication threads / slow responses",
    DOCUMENTATION_GAP: "Compliance or documentation readiness gaps",
    NEGOTIATION_BREAKDOWN: "Idle negotiation / stalled deal-stage tension",
    OTHER: "Mixed or uncategorized friction drivers",
  };
  return labels[cat] ?? cat;
}
