import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { markWatchlistAlertReadRow } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";

export async function markAlertRead(args: { userId: string; alertId: string }) {
  const out = await markWatchlistAlertReadRow(args);
  if (out.count > 0) captureServerEvent(args.userId, "watchlist_alert_opened", { alertId: args.alertId });
  return { ok: out.count > 0 };
}
