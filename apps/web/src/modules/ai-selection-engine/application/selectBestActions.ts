import { deriveActionRecommendation } from "@/src/modules/ai-selection-engine/infrastructure/actionSelectionService";
import type { ActionSelectionInput, ActionSelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";

export function selectBestActions(entity: { id: string; type: string } & ActionSelectionInput): ActionSelectionResult {
  const recommendation = deriveActionRecommendation(entity);
  const score = Math.max(0, Math.min(100, Math.round(entity.score ?? 0)));
  const confidence = Math.max(0, Math.min(100, Math.round(entity.confidence ?? 40)));

  return {
    id: `${entity.type}:${entity.id}`,
    type: "action",
    action: recommendation.action,
    score,
    confidence,
    reasons: recommendation.reasons,
    recommendedAction: recommendation.action,
  };
}
