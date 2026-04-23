import type { ScenarioDifficulty } from "./training-scenarios.types";

const ORDER: ScenarioDifficulty[] = ["EASY", "MEDIUM", "HARD", "EXTREME"];

/** Rolling average threshold to unlock next band (training hub progression). */
const THRESHOLD_FOR_NEXT: Partial<Record<ScenarioDifficulty, number>> = {
  EASY: 48,
  MEDIUM: 56,
  HARD: 68,
};

/** Sessions + mastery gate for EXTREME */
const EXTREME_MIN_SESSIONS = 12;
const EXTREME_MIN_ROLLING = 82;

export type ProgressSnapshot = {
  rollingAverageScore: number;
  sessionCount: number;
};

export function difficultyOrderIndex(d: ScenarioDifficulty): number {
  return ORDER.indexOf(d);
}

/**
 * Whether a difficulty tier is playable given aggregate training stats.
 */
export function isDifficultyUnlocked(level: ScenarioDifficulty, progress: ProgressSnapshot): boolean {
  if (level === "EASY") return true;
  const idx = difficultyOrderIndex(level);
  if (idx <= 0) return true;

  if (level === "EXTREME") {
    return progress.sessionCount >= EXTREME_MIN_SESSIONS && progress.rollingAverageScore >= EXTREME_MIN_ROLLING;
  }

  const prev = ORDER[idx - 1];
  const need = THRESHOLD_FOR_NEXT[prev!];
  if (need == null) return true;
  return progress.rollingAverageScore >= need && progress.sessionCount >= (idx === 1 ? 2 : 3);
}

export function maxUnlockedDifficulty(progress: ProgressSnapshot): ScenarioDifficulty {
  let best: ScenarioDifficulty = "EASY";
  for (const d of ORDER) {
    if (isDifficultyUnlocked(d, progress)) best = d;
  }
  return best;
}
