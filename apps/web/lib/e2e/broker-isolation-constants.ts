/**
 * Fixed ids/emails for `pnpm seed:qa-blockers` and Playwright broker isolation tests.
 * Leads use a non-shared `leadSource` so only the introducing broker (or admin) may read them.
 */
export const BROKER_ISOLATION_SEED = {
  alphaUserId: "qa-e2e-broker-alpha",
  betaUserId: "qa-e2e-broker-beta",
  alphaEmail: "broker-alpha-e2e@lecipm.test",
  betaEmail: "broker-beta-e2e@lecipm.test",
  /** Same password for both QA brokers */
  password: "BrokerE2e2024!",
  leadAlphaId: "qa-e2e-lead-owned-alpha",
  leadBetaId: "qa-e2e-lead-owned-beta",
} as const;
