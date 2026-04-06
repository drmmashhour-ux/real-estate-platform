import type { BookingOutcome } from "./listing-weight-hints";
import { suggestRankingWeightAdjustments } from "./listing-weight-hints";

export type LearningEngineInput = {
  bookingOutcomes: BookingOutcome[];
};

/**
 * Single hook for “self-learning” passes — pure suggestions; persist weights in config/DB separately.
 */
export function runLearningPass(input: LearningEngineInput) {
  const rankingWeights = suggestRankingWeightAdjustments(input.bookingOutcomes);
  return {
    rankingWeights,
    generatedAt: new Date().toISOString(),
  };
}
