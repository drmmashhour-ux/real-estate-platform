import { watchlistAlertsConfig } from "@/src/config/watchlistAlerts";
import { findRecentSimilarAlert } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";

export function buildAlertSignature(metadata: Record<string, unknown>) {
  const sorted = Object.keys(metadata)
    .sort()
    .reduce((acc, k) => {
      acc[k] = metadata[k];
      return acc;
    }, {} as Record<string, unknown>);
  return JSON.stringify(sorted);
}

export async function shouldCreateWatchlistAlert(args: {
  userId: string;
  listingId: string;
  alertType: string;
  metadata: Record<string, unknown>;
}) {
  const signature = buildAlertSignature(args.metadata);
  const since = new Date(Date.now() - watchlistAlertsConfig.duplicateAlertCooldownHours * 3600_000);
  const existing = await findRecentSimilarAlert({
    userId: args.userId,
    listingId: args.listingId,
    alertType: args.alertType,
    signature,
    since,
  });
  return { shouldCreate: !existing, signature };
}
