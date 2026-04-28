/**
 * Server-readable env for auto-narration (passed into client providers via props).
 * No secrets — booleans only.
 */
export type AutoNarrationEnvSnapshot = {
  autoNarrationEnabled: boolean;
  autoNarrationTtsEnabled: boolean;
};

export function getAutoNarrationEnvSnapshot(): AutoNarrationEnvSnapshot {
  return {
    autoNarrationEnabled: process.env.AUTO_NARRATION_ENABLED?.trim().toLowerCase() === "true",
    /** Default ON unless explicitly set to false */
    autoNarrationTtsEnabled: process.env.AUTO_NARRATION_TTS_ENABLED?.trim().toLowerCase() !== "false",
  };
}
