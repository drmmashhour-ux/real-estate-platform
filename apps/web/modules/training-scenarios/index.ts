export type {
  ScenarioAudience,
  ScenarioDifficulty,
  ScenarioPersonality,
  ScenarioSuccessCondition,
  TrainingScenario,
} from "./training-scenarios.types";

export { TRAINING_SCENARIOS } from "./training-scenarios.data";

export {
  getAllScenarios,
  getRandomScenario,
  getScenarioById,
  getScenariosByDifficulty,
  getScenariosByType,
  listScenarios,
} from "./training-scenario.service";

export {
  appendScenarioUserTurn,
  difficultyToPaceLevel,
  matchesScenarioSuccess,
  startScenarioLiveSession,
} from "./scenario-session.engine";

export { scoreScenarioTurn } from "./scenario-scoring.service";
export type { ScenarioDimensionScores } from "./scenario-scoring.service";

export {
  difficultyOrderIndex,
  isDifficultyUnlocked,
  maxUnlockedDifficulty,
} from "./scenario-progress.service";
export type { ProgressSnapshot } from "./scenario-progress.service";

export {
  bestScenarios,
  hardestScenarios,
  improvementTrend,
  loadScenarioAnalytics,
  recordScenarioSession,
} from "./scenario-analytics.service";
