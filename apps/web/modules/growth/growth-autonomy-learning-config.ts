/**
 * Env-backed guardrails for autonomy learning — conservative defaults.
 */

export type GrowthAutonomyLearningGuardrails = {
  maxPriorityIncrease: number;
  maxPriorityDecrease: number;
  minObservationsBeforeLearning: number;
  suppressionThresholdIgnoredRate: number;
  negativeFeedbackSuppressionRate: number;
  reevaluationCooldownMs: number;
  stepIncrease: number;
  stepDecrease: number;
};

function parseFloatEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function getGrowthAutonomyLearningGuardrails(): GrowthAutonomyLearningGuardrails {
  return {
    maxPriorityIncrease: parseFloatEnv("GROWTH_AUTONOMY_LEARNING_MAX_UP", 0.06),
    maxPriorityDecrease: parseFloatEnv("GROWTH_AUTONOMY_LEARNING_MAX_DOWN", 0.08),
    minObservationsBeforeLearning: parseIntEnv("GROWTH_AUTONOMY_LEARNING_MIN_OBS", 12),
    suppressionThresholdIgnoredRate: parseFloatEnv("GROWTH_AUTONOMY_LEARNING_IGNORE_SUPPRESS", 0.72),
    negativeFeedbackSuppressionRate: parseFloatEnv("GROWTH_AUTONOMY_LEARNING_NEG_SUPPRESS", 0.45),
    reevaluationCooldownMs: parseIntEnv("GROWTH_AUTONOMY_LEARNING_COOLDOWN_MS", 86_400_000),
    stepIncrease: parseFloatEnv("GROWTH_AUTONOMY_LEARNING_STEP_UP", 0.015),
    stepDecrease: parseFloatEnv("GROWTH_AUTONOMY_LEARNING_STEP_DOWN", 0.02),
  };
}
