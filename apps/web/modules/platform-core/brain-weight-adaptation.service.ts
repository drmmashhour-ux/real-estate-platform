import {
  BRAIN_WEIGHT_DEFAULTS,
  BRAIN_WEIGHT_LIMITS,
  BRAIN_LEARNING_THRESHOLDS,
} from "./brain-v2.constants";
import type { BrainLearningSource, BrainOutcomeRecord, BrainSourceWeight } from "./brain-v2.types";

export function adaptSourceWeight(input: {
  current: BrainSourceWeight;
  outcomes: BrainOutcomeRecord[];
}): BrainSourceWeight {
  const relevant = input.outcomes.filter((x) => x.source === input.current.source);
  if (relevant.length === 0) return input.current;

  let positiveCount = input.current.positiveCount;
  let negativeCount = input.current.negativeCount;
  let neutralCount = input.current.neutralCount;
  let sampleCount = input.current.sampleCount;
  let weight = input.current.weight;

  for (const outcome of relevant) {
    sampleCount += 1;

    if (
      outcome.outcomeType === "POSITIVE" &&
      outcome.outcomeScore >= BRAIN_LEARNING_THRESHOLDS.MIN_OUTCOME_SCORE_TO_REWARD
    ) {
      positiveCount += 1;
      weight += BRAIN_WEIGHT_LIMITS.MAX_STEP_UP;
    } else if (
      outcome.outcomeType === "NEGATIVE" &&
      outcome.outcomeScore <= BRAIN_LEARNING_THRESHOLDS.MAX_NEGATIVE_THRESHOLD
    ) {
      negativeCount += 1;
      weight -= BRAIN_WEIGHT_LIMITS.MAX_STEP_DOWN;
    } else {
      neutralCount += 1;
    }
  }

  weight = Math.max(BRAIN_WEIGHT_LIMITS.MIN, Math.min(BRAIN_WEIGHT_LIMITS.MAX, weight));

  const confidence =
    sampleCount >= BRAIN_LEARNING_THRESHOLDS.MIN_SAMPLE_COUNT_FOR_CONFIDENCE
      ? Math.min(1, 0.5 + sampleCount * 0.03)
      : Math.min(0.6, 0.3 + sampleCount * 0.05);

  return {
    source: input.current.source,
    weight: Number(weight.toFixed(3)),
    confidence: Number(confidence.toFixed(3)),
    sampleCount,
    positiveCount,
    negativeCount,
    neutralCount,
    lastLearnedAt: new Date().toISOString(),
  };
}

export function getDefaultBrainSourceWeights(): BrainSourceWeight[] {
  return (Object.entries(BRAIN_WEIGHT_DEFAULTS) as [BrainLearningSource, number][]).map(([source, weight]) => ({
    source,
    weight,
    confidence: 0.3,
    sampleCount: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
    lastLearnedAt: null,
  }));
}
