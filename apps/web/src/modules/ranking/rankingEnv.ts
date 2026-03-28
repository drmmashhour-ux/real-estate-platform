/**
 * Feature flags for the LECIPM ranking engine.
 * Default off until explicitly enabled in an environment.
 */
export function isAiRankingEngineEnabled(): boolean {
  return process.env.AI_RANKING_ENGINE_ENABLED === "1" || process.env.AI_RANKING_ENGINE_ENABLED === "true";
}

export function isAiRankingExplanationsEnabled(): boolean {
  if (process.env.AI_RANKING_EXPLANATIONS_ENABLED === "0") return false;
  if (process.env.AI_RANKING_EXPLANATIONS_ENABLED === "false") return false;
  return (
    process.env.AI_RANKING_EXPLANATIONS_ENABLED === "1" ||
    process.env.AI_RANKING_EXPLANATIONS_ENABLED === "true" ||
    isAiRankingEngineEnabled()
  );
}
