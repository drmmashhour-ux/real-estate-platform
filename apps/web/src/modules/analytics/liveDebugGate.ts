import "server-only";

/**
 * Live debug UI is only available when LIVE_DEBUG_MODE=1 (in addition to admin auth).
 */
export function isLiveDebugDashboardEnabled(): boolean {
  return process.env.LIVE_DEBUG_MODE === "1";
}
