import { isInvestorDemoModeActive } from "./investor-demo";

/**
 * Ops-facing alias for Syria investor (SYBNB) demo state.
 *
 * Effective demo / TTL:
 * - {@link syncInvestorDemoSessionExpiry} runs inside {@link isInvestorDemoModeActive}
 *   (see `@/lib/demo/demo-session`).
 * - When `now > INVESTOR_DEMO_MODE_EXPIRES_AT`, runtime demo is cleared, force-off engaged,
 *   optional {@link runInvestorDemoResetThrottled} when auto-clean was on, and `DEMO_SESSION_EXPIRED` is logged.
 */
export async function isDemoModeActive(): Promise<boolean> {
  return isInvestorDemoModeActive();
}
