import type { BrainRecommendationDraft } from "./opportunity-detector";

export function applyLearningToDraft(draft: BrainRecommendationDraft, multiplier: number): BrainRecommendationDraft {
  const c = Math.max(0.15, Math.min(0.95, draft.confidence * multiplier));
  return { ...draft, confidence: Math.round(c * 1000) / 1000 };
}
