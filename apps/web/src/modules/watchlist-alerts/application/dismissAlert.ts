import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { dismissWatchlistAlertRow } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";

export async function dismissAlert(args: { userId: string; alertId: string }) {
  const out = await dismissWatchlistAlertRow(args);
  if (out.count > 0) captureServerEvent(args.userId, "watchlist_alert_dismissed", { alertId: args.alertId });
  return { ok: out.count > 0 };
}
