import { isInvestorDemoModeActive } from "./investor-demo";

/**
 * Ops-facing alias for Syria investor (SYBNB) demo state.
 *
 * Effective demo / TTL:
 * - {@link syncInvestorDemoSessionExpiry} runs inside {@link isInvestorDemoModeActive}
 *   (see `@/lib/demo/demo-session`).
 * - When `INVESTOR_DEMO_MODE_EXPIRES_AT` is in the past, runtime demo flags are cleared for this
 *   Node process (no restart, no `.env` writes).
 */
export async function isDemoModeActive(): Promise<boolean> {
  return isInvestorDemoModeActive();
}
