import { watchlistAlertsConfig } from "@/src/config/watchlistAlerts";
import type { WatchlistAlertSeverity, WatchlistAlertType } from "@/src/modules/watchlist-alerts/domain/watchlistAlert.types";

export function resolveWatchlistAlertSeverity(args: {
  alertType: WatchlistAlertType;
  previousValue: string | number | null;
  currentValue: string | number | null;
}): WatchlistAlertSeverity {
  const { alertType, previousValue, currentValue } = args;

  if (alertType === "fraud_risk_up") {
    const n = typeof currentValue === "number" ? currentValue : 0;
    return n >= watchlistAlertsConfig.criticalFraudThreshold ? "critical" : "warning";
  }

  if (alertType === "trust_score_changed") {
    const n = typeof currentValue === "number" ? currentValue : 100;
    if (n <= watchlistAlertsConfig.warningTrustThreshold) return "warning";
    return "info";
  }

  if (alertType === "listing_status_changed") return "warning";

  if (alertType === "price_changed") {
    const p = typeof previousValue === "number" ? previousValue : null;
    const n = typeof currentValue === "number" ? currentValue : null;
    if (p != null && n != null && p > 0) {
      const pct = Math.abs(((n - p) / p) * 100);
      if (pct >= 10) return "critical";
      if (pct >= watchlistAlertsConfig.minimumPriceChangePercent) return "warning";
    }
    return "info";
  }

  if (alertType === "deal_score_down") return "warning";

  return "info";
}
