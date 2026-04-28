/**
 * Server-readable flags for optional demo QA AI — no secrets.
 */
export type DemoQaEnvSnapshot = {
  demoQaAiEnabled: boolean;
};

export function getDemoQaEnvSnapshot(): DemoQaEnvSnapshot {
  return {
    demoQaAiEnabled: process.env.DEMO_QA_AI_ENABLED?.trim().toLowerCase() === "true",
  };
}
