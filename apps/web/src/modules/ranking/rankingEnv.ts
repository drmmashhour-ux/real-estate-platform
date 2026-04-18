import { engineFlags } from "@/config/feature-flags";

/**
 * Feature flags for the LECIPM ranking engine.
 * `FEATURE_RANKING_V1` enables the v1 pipeline; legacy `AI_RANKING_ENGINE_ENABLED` remains supported.
 */
export function isAiRankingEngineEnabled(): boolean {
  if (engineFlags.rankingV1) return true;
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
