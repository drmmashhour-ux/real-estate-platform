export type {
  ClientPersonalityType,
  ClosingCoachBundle,
  PersonalityDetectionResult,
  PersonalityLearningAgg,
  PersonalityStrategy,
} from "./personality.types";

export { detectClientPersonality } from "./personality-detection.service";
export { getPersonalityStrategy } from "./personality-strategy.service";
export { buildClosingCoachBundle } from "./personality-response.service";
export {
  bestStrategyPerPersonality,
  loadPersonalityLearning,
  personalityWinRates,
  recordPersonalityOutcome,
} from "./personality-learning.service";
