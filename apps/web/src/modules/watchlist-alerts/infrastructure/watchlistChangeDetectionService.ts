import { watchlistAlertsConfig } from "@/src/config/watchlistAlerts";
import type { WatchlistAlertSeverity, WatchlistAlertType, WatchlistListingSnapshot } from "@/src/modules/watchlist-alerts/domain/watchlist.types";
import { compareWatchlistSnapshots } from "@/src/modules/watchlist-alerts/application/compareWatchlistSnapshots";

type Trigger = {
  type: WatchlistAlertType;
  severity: WatchlistAlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
};

function pctChange(prev: number, next: number): number {
  if (prev === 0) return 0;
  return ((next - prev) / prev) * 100;
}

export function compareWatchlistSnapshot(
  previous: WatchlistListingSnapshot | null,
  current: WatchlistListingSnapshot
): {
  hasChanges: boolean;
  changedFields: Array<"dealScore" | "trustScore" | "price" | "confidence" | "recommendation">;
} {
  if (!previous) return { hasChanges: false, changedFields: [] };
  const changedFields: Array<"dealScore" | "trustScore" | "price" | "confidence" | "recommendation"> = [];
  if (previous.dealScore !== current.dealScore) changedFields.push("dealScore");
  if (previous.trustScore !== current.trustScore) changedFields.push("trustScore");
  if (previous.price !== current.price) changedFields.push("price");
  if (previous.confidence !== current.confidence) changedFields.push("confidence");
  if (previous.recommendation !== current.recommendation) changedFields.push("recommendation");
  return { hasChanges: changedFields.length > 0, changedFields };
}

/**
 * Phase 2 direct snapshot comparison (no thresholds).
 * Keeps a deterministic bridge for Phase 3 alert filtering.
 */
export function detectDirectSnapshotChanges(
  previous: WatchlistListingSnapshot | null,
  current: WatchlistListingSnapshot
) {
  return compareWatchlistSnapshots(
    previous
      ? {
          id: "prev",
          userId: "",
          listingId: previous.listingId,
          dealScore: previous.dealScore,
          trustScore: previous.trustScore,
          fraudScore: previous.fraudScore,
          confidence: previous.confidence,
          recommendation: previous.recommendation,
          price: previous.price,
          listingStatus: previous.listingStatus,
          createdAt: new Date(0),
        }
      : null,
    {
      id: "curr",
      userId: "",
      listingId: current.listingId,
      dealScore: current.dealScore,
      trustScore: current.trustScore,
      fraudScore: current.fraudScore,
      confidence: current.confidence,
      recommendation: current.recommendation,
      price: current.price,
      listingStatus: current.listingStatus,
      createdAt: new Date(0),
    }
  );
}

export function detectWatchlistChanges(args: { previous: WatchlistListingSnapshot | null; current: WatchlistListingSnapshot }): Trigger[] {
  const { previous, current } = args;
  if (!previous) return [];
  const out: Trigger[] = [];
  const compared = compareWatchlistSnapshot(previous, current);

  if (previous.price != null && current.price != null) {
    const deltaPct = pctChange(previous.price, current.price);
    if (Math.abs(deltaPct) >= watchlistAlertsConfig.minPriceChangePct) {
      out.push({ type: "price_changed", severity: Math.abs(deltaPct) >= 10 ? "critical" : "warning", title: "Price changed", message: `Price changed by ${Math.round(deltaPct * 10) / 10}%`, metadata: { prevPrice: previous.price, nextPrice: current.price, deltaPct } });
    }
  }

  if (previous.dealScore != null && current.dealScore != null) {
    const delta = current.dealScore - previous.dealScore;
    if (Math.abs(delta) >= watchlistAlertsConfig.minDealScoreDelta) {
      out.push({ type: delta > 0 ? "deal_score_up" : "deal_score_down", severity: Math.abs(delta) >= 12 ? "warning" : "info", title: delta > 0 ? "Deal score improved" : "Deal score dropped", message: `Deal score moved from ${previous.dealScore} to ${current.dealScore}`, metadata: { prevDealScore: previous.dealScore, nextDealScore: current.dealScore, delta } });
    }
  }

  if (previous.trustScore != null && current.trustScore != null) {
    const delta = current.trustScore - previous.trustScore;
    if (Math.abs(delta) >= watchlistAlertsConfig.minTrustScoreDelta) {
      out.push({ type: "trust_score_changed", severity: current.trustScore < 45 ? "warning" : "info", title: "Trust score changed", message: `Trust score moved from ${previous.trustScore} to ${current.trustScore}`, metadata: { prevTrustScore: previous.trustScore, nextTrustScore: current.trustScore, delta } });
    }
  }

  if (previous.fraudScore != null && current.fraudScore != null) {
    const crossedWarning = previous.fraudScore < watchlistAlertsConfig.riskEscalationWarningAt && current.fraudScore >= watchlistAlertsConfig.riskEscalationWarningAt;
    const crossedCritical = previous.fraudScore < watchlistAlertsConfig.riskEscalationCriticalAt && current.fraudScore >= watchlistAlertsConfig.riskEscalationCriticalAt;
    if (crossedWarning || crossedCritical) {
      out.push({ type: "fraud_risk_up", severity: crossedCritical ? "critical" : "warning", title: "Risk increased", message: `Risk moved from ${previous.fraudScore} to ${current.fraudScore}`, metadata: { prevFraudScore: previous.fraudScore, nextFraudScore: current.fraudScore } });
    }
  }

  if (previous.confidence != null && current.confidence != null) {
    const delta = current.confidence - previous.confidence;
    if (Math.abs(delta) >= 6) {
      out.push({ type: delta > 0 ? "confidence_up" : "confidence_down", severity: "info", title: delta > 0 ? "Confidence improved" : "Confidence dropped", message: `Confidence moved from ${previous.confidence} to ${current.confidence}`, metadata: { prevConfidence: previous.confidence, nextConfidence: current.confidence, delta } });
    }
  }

  if (previous.listingStatus && current.listingStatus && previous.listingStatus !== current.listingStatus) {
    out.push({ type: "listing_status_changed", severity: ["SOLD", "REMOVED", "SUSPENDED"].includes(current.listingStatus) ? "critical" : "warning", title: "Listing status changed", message: `${previous.listingStatus} → ${current.listingStatus}`, metadata: { prevStatus: previous.listingStatus, nextStatus: current.listingStatus } });
  }

  if ((previous.dealScore ?? 0) < watchlistAlertsConfig.strongOpportunityDealScore && (current.dealScore ?? 0) >= watchlistAlertsConfig.strongOpportunityDealScore && (current.trustScore ?? 0) >= watchlistAlertsConfig.strongOpportunityTrustScore) {
    out.push({ type: "strong_opportunity_detected", severity: "info", title: "Strong opportunity detected", message: "This listing now meets strong-opportunity criteria.", metadata: { dealScore: current.dealScore, trustScore: current.trustScore } });
  }

  if ((previous.dealScore ?? 100) > watchlistAlertsConfig.needsReviewDealScore && (current.dealScore ?? 100) <= watchlistAlertsConfig.needsReviewDealScore) {
    out.push({ type: "needs_review_detected", severity: "warning", title: "Needs review", message: "This listing now falls into review territory.", metadata: { dealScore: current.dealScore, trustScore: current.trustScore } });
  }

  if (previous.recommendation !== current.recommendation) {
    out.push({
      type: "needs_review_detected",
      severity: "info",
      title: "Recommendation updated",
      message: "Recommendation changed based on latest deterministic signals.",
      metadata: {
        previousRecommendation: previous.recommendation,
        currentRecommendation: current.recommendation,
      },
    });
  }

  // Include a compact deterministic comparison summary on each emitted trigger.
  if (out.length > 0) {
    for (const t of out) {
      t.metadata = {
        ...t.metadata,
        comparedFields: compared.changedFields,
      };
    }
  }

  return out;
}
