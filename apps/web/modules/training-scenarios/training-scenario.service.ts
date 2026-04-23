import { TRAINING_SCENARIOS } from "./training-scenarios.data";
import type { ScenarioAudience, ScenarioDifficulty, TrainingScenario } from "./training-scenarios.types";

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]!;
}

export function getScenarioById(id: string): TrainingScenario | undefined {
  return TRAINING_SCENARIOS.find((s) => s.id === id);
}

export function getScenariosByDifficulty(level: ScenarioDifficulty): TrainingScenario[] {
  return TRAINING_SCENARIOS.filter((s) => s.difficulty === level);
}

export function getScenariosByType(type: ScenarioAudience): TrainingScenario[] {
  return TRAINING_SCENARIOS.filter((s) => s.type === type);
}

export function getAllScenarios(): TrainingScenario[] {
  return [...TRAINING_SCENARIOS];
}

/**
 * Filter by type and/or difficulty; if level omitted, all levels for that type.
 */
export function listScenarios(filter?: { type?: ScenarioAudience; difficulty?: ScenarioDifficulty }): TrainingScenario[] {
  let list = getAllScenarios();
  if (filter?.type) list = list.filter((s) => s.type === filter.type);
  if (filter?.difficulty) list = list.filter((s) => s.difficulty === filter.difficulty);
  return list;
}

export function getRandomScenario(type: ScenarioAudience, level: ScenarioDifficulty, seed = Date.now()): TrainingScenario {
  const pool = TRAINING_SCENARIOS.filter((s) => s.type === type && s.difficulty === level);
  if (pool.length === 0) {
    const loose = TRAINING_SCENARIOS.filter((s) => s.type === type);
    return pick(loose, seed);
  }
  return pick(pool, seed);
}
