export { computeContentPerformanceScore, legacyScoreFromRow, DEFAULT_SCORE_WEIGHTS } from "./scoring";
export type { PerformanceMetrics } from "./scoring";
export { refreshAllMachineContentPerformanceScores, refreshMachineContentScoreById } from "./analyze-performance";
export { analyzeOptimizationSignals, getTopMachineContentByScore, getWorstMachineContentByScore } from "./get-winners";
export { extractCtaBucket, extractVisualOrderKey } from "./signals";
export { generateContentRecommendations, styleBiasWeights } from "./generate-recommendations";
export { buildLearningAugmentationForListing } from "./learning-context";
export type {
  ContentOptimizationSignals,
  ExtendedOptimizationSignals,
  CtaBucketStat,
  VisualOrderStat,
  CityStyleStat,
} from "./types";
