/**
 * Priority ordering for strategic initiatives — deterministic scoring only (no LLM).
 */
import type { AiCeoPrioritizedSet, AiCeoRecommendationDraft } from "@/modules/ai-ceo/ai-ceo.types";
import {
  assignPrioritizationBucket,
  prioritizationScore,
  prioritizeRecommendations,
} from "@/modules/ai-ceo/ai-ceo-prioritization.service";

export { assignPrioritizationBucket, prioritizationScore, prioritizeRecommendations };

/** Rank raw recommendation drafts into the standard buckets. */
export function rankStrategicInitiatives(drafts: AiCeoRecommendationDraft[]): AiCeoPrioritizedSet {
  return prioritizeRecommendations(drafts);
}
