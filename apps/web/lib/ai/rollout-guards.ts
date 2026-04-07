/**
 * Optional env gates for gradual AI / autopilot rollout (in addition to DB-backed settings).
 * All helpers default to **allow** when unset so production behavior is unchanged until you opt in to stricter gates.
 */

function isEnvDisabled(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "no" || v === "off";
}

/** When false, host-facing autopilot trigger API should reject (see `/api/ai/host-autopilot/run`). */
export function isHostAutopilotRunApiEnabled(): boolean {
  return !isEnvDisabled(process.env.LECIPM_HOST_AUTOPILOT_API_ENABLED);
}

/** When false, treat learning / ranking surfaces as disabled for new server actions (optional hook). */
export function isAiLearningSurfacesEnabled(): boolean {
  return !isEnvDisabled(process.env.LECIPM_AI_LEARNING_ENABLED);
}

/** When false, decision-ranking endpoints can short-circuit (optional hook). */
export function isAiDecisionRankingEnabled(): boolean {
  return !isEnvDisabled(process.env.LECIPM_AI_DECISION_RANKING_ENABLED);
}
