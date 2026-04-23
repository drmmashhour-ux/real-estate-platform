/**
 * Rollout flag: when true, watchlist alerts trigger the unified dispatcher (email / SMS / push)
 * and legacy direct marketing email paths for the same alert should be skipped.
 */
export function isNotificationDeliveryV1Enabled(): boolean {
  return process.env.LECIPM_NOTIFICATION_DELIVERY_V1 === "true";
}
