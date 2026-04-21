/** Self-learning loop — descriptive analytics over `DealOutcome` rows; not causal ML. */

export type DealOutcomeSlice = {
  outcome: string;
  durationDays: number;
  priceDelta: number;
};

export type ExtractedLearningPattern = {
  pattern: string;
  confidence: number;
  impactScore: number;
  sampleSize: number;
};
