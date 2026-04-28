/**
 * Server-readable AI narration flags (passed into client providers via props). No API keys.
 */
export type AiNarrationEnvSnapshot = {
  aiNarrationEnabled: boolean;
};

export function getAiNarrationEnvSnapshot(): AiNarrationEnvSnapshot {
  return {
    aiNarrationEnabled: process.env.AI_NARRATION_ENABLED?.trim().toLowerCase() === "true",
  };
}
