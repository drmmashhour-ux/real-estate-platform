import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { watchlistAlertsConfig } from "@/src/config/watchlistAlerts";
import type { WatchlistSnapshotComparison } from "@/src/modules/watchlist-alerts/domain/watchlistSnapshot.types";
import type { WatchlistAlertInput, WatchlistAlertType } from "@/src/modules/watchlist-alerts/domain/watchlistAlert.types";
import { createWatchlistAlert } from "@/src/modules/watchlist-alerts/infrastructure/watchlistAlertRepository";
import { resolveWatchlistAlertSeverity } from "@/src/modules/watchlist-alerts/infrastructure/watchlistSeverityService";
import { shouldCreateWatchlistAlert } from "@/src/modules/watchlist-alerts/infrastructure/watchlistDuplicateAlertService";

function asNum(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function thresholdPass(changeType: string, prev: unknown, curr: unknown): boolean {
  const p = asNum(prev);
  const n = asNum(curr);

  if (changeType === "price_changed") {
    if (p == null || n == null || p === 0) return false;
    return Math.abs(((n - p) / p) * 100) >= watchlistAlertsConfig.minimumPriceChangePercent;
  }
  if (changeType === "deal_score_changed") {
    if (p == null || n == null) return false;
    return Math.abs(n - p) >= watchlistAlertsConfig.minimumDealScoreDelta;
  }
  if (changeType === "trust_score_changed") {
    if (p == null || n == null) return false;
    return Math.abs(n - p) >= watchlistAlertsConfig.minimumTrustScoreDelta;
  }
  if (changeType === "confidence_changed") {
    if (p == null || n == null) return false;
    return Math.abs(n - p) >= watchlistAlertsConfig.minimumConfidenceDelta;
  }
  return true;
}

function toAlertType(changeType: string, prev: unknown, curr: unknown): WatchlistAlertType | null {
  if (changeType === "price_changed") return "price_changed";
  if (changeType === "deal_score_changed") {
    const p = asNum(prev);
    const n = asNum(curr);
    if (p == null || n == null) return null;
    return n >= p ? "deal_score_up" : "deal_score_down";
  }
  if (changeType === "trust_score_changed") return "trust_score_changed";
  if (changeType === "fraud_score_changed") {
    const p = asNum(prev);
    const n = asNum(curr);
    if (p == null || n == null || n <= p) return null;
    const prevBand = p >= watchlistAlertsConfig.criticalFraudThreshold ? 2 : p >= 55 ? 1 : 0;
    const currBand = n >= watchlistAlertsConfig.criticalFraudThreshold ? 2 : n >= 55 ? 1 : 0;
    return currBand > prevBand ? "fraud_risk_up" : null;
  }
  if (changeType === "confidence_changed") {
    const p = asNum(prev);
    const n = asNum(curr);
    if (p == null || n == null) return null;
    return n >= p ? "confidence_up" : "confidence_down";
  }
  if (changeType === "listing_status_changed") return "listing_status_changed";
  if (changeType === "recommendation_changed") {
    const next = String(curr ?? "").toLowerCase();
    const prevStr = String(prev ?? "").toLowerCase();
    if (!prevStr.includes("strong") && next.includes("strong")) return "strong_opportunity_detected";
    if (!prevStr.includes("review") && next.includes("review")) return "needs_review_detected";
    return null;
  }
  return null;
}

function labelFor(alertType: WatchlistAlertType) {
  if (alertType === "price_changed") return ["Price changed on a saved property", "Price changed based on latest listing data."] as const;
  if (alertType === "deal_score_up") return ["Deal score improved", "The deterministic deal score increased."] as const;
  if (alertType === "deal_score_down") return ["Deal score declined", "The deterministic deal score decreased."] as const;
  if (alertType === "trust_score_changed") return ["Trust changed on this property", "Trust score changed based on new signals."] as const;
  if (alertType === "fraud_risk_up") return ["Risk increased - review recommended", "Risk score moved into a higher band."] as const;
  if (alertType === "confidence_up") return ["Confidence improved", "Confidence in the current scoring increased."] as const;
  if (alertType === "confidence_down") return ["Confidence dropped", "Confidence in the current scoring decreased."] as const;
  if (alertType === "listing_status_changed") return ["Listing status changed", "Status changed on a property you are watching."] as const;
  if (alertType === "strong_opportunity_detected") return ["Stronger opportunity detected", "This saved property now looks like a stronger opportunity."] as const;
  return ["Needs review detected", "This saved property now needs closer review."] as const;
}

export async function createAlertsFromComparison(args: {
  userId: string;
  watchlistId: string | null;
  listingId: string;
  comparison: WatchlistSnapshotComparison;
}) {
  const created: any[] = [];

  for (const change of args.comparison.changes) {
    if (!thresholdPass(change.changeType, change.previousValue, change.currentValue)) continue;

    const alertType = toAlertType(change.changeType, change.previousValue, change.currentValue);
    if (!alertType) continue;

    const metadata = {
      changeType: change.changeType,
      previousValue: change.previousValue,
      currentValue: change.currentValue,
    } as Record<string, unknown>;

    const { shouldCreate, signature } = await shouldCreateWatchlistAlert({
      userId: args.userId,
      listingId: args.listingId,
      alertType,
      metadata,
    });
    if (!shouldCreate) continue;

    const [title, message] = labelFor(alertType);
    const severity = resolveWatchlistAlertSeverity({
      alertType,
      previousValue: change.previousValue,
      currentValue: change.currentValue,
    });

    const input: WatchlistAlertInput = {
      userId: args.userId,
      watchlistId: args.watchlistId,
      listingId: args.listingId,
      alertType,
      severity,
      title,
      message,
      metadata: { ...metadata, signature },
    };

    const row = await createWatchlistAlert(input);
    created.push(row);
    captureServerEvent(args.userId, "watchlist_alert_generated", {
      alertType,
      severity,
      listingId: args.listingId,
    });
  }

  return created;
}
