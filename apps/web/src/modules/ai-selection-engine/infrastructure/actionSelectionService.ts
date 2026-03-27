import { ActionRecommendation } from "@/src/modules/ai-selection-engine/domain/selection.enums";
import type { ActionSelectionInput } from "@/src/modules/ai-selection-engine/domain/selection.types";
import { buildListingSignals } from "@/src/core/intelligence/signals/signalsEngine";
import { computeScores } from "@/src/core/intelligence/scoring/scoringEngine";
import { selectBestActionsFromScores } from "@/src/core/intelligence/selection/selectionEngine";

export function deriveActionRecommendation(input: ActionSelectionInput): { action: ActionRecommendation; reasons: string[] } {
  const signals = buildListingSignals({
    priceCents: 1,
    trustScore: input.trustScore ?? 50,
    riskScore: input.riskScore ?? 40,
    rentalDemand: input.score ?? 50,
    locationScore: input.score ?? 50,
    freshnessDays: 2,
  });
  const scores = computeScores(signals);
  const action = selectBestActionsFromScores("selection-action", {
    ...scores,
    dealScore: input.score ?? scores.dealScore,
    confidenceScore: input.confidence ?? scores.confidenceScore,
    trustScore: input.trustScore ?? scores.trustScore,
    riskScore: input.riskScore ?? scores.riskScore,
  })[0];

  return {
    action: action.recommendedAction as ActionRecommendation,
    reasons: action.reasons,
  };
}
