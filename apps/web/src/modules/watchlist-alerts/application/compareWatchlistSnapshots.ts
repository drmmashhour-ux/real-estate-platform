import type {
  WatchlistSnapshotChange,
  WatchlistSnapshotComparison,
  WatchlistSnapshotState,
} from "@/src/modules/watchlist-alerts/domain/watchlistSnapshot.types";

export function compareWatchlistSnapshots(
  previousSnapshot: WatchlistSnapshotState | null,
  currentSnapshot: WatchlistSnapshotState
): WatchlistSnapshotComparison {
  if (!previousSnapshot) return { hasChanges: false, changes: [] };

  const changes: WatchlistSnapshotChange[] = [];

  if (previousSnapshot.price !== currentSnapshot.price) {
    changes.push({ changeType: "price_changed", previousValue: previousSnapshot.price, currentValue: currentSnapshot.price });
  }
  if (previousSnapshot.dealScore !== currentSnapshot.dealScore) {
    changes.push({ changeType: "deal_score_changed", previousValue: previousSnapshot.dealScore, currentValue: currentSnapshot.dealScore });
  }
  if (previousSnapshot.trustScore !== currentSnapshot.trustScore) {
    changes.push({ changeType: "trust_score_changed", previousValue: previousSnapshot.trustScore, currentValue: currentSnapshot.trustScore });
  }
  if (previousSnapshot.fraudScore !== currentSnapshot.fraudScore) {
    changes.push({ changeType: "fraud_score_changed", previousValue: previousSnapshot.fraudScore, currentValue: currentSnapshot.fraudScore });
  }
  if (previousSnapshot.confidence !== currentSnapshot.confidence) {
    changes.push({ changeType: "confidence_changed", previousValue: previousSnapshot.confidence, currentValue: currentSnapshot.confidence });
  }
  if (previousSnapshot.recommendation !== currentSnapshot.recommendation) {
    changes.push({ changeType: "recommendation_changed", previousValue: previousSnapshot.recommendation, currentValue: currentSnapshot.recommendation });
  }
  if (previousSnapshot.listingStatus !== currentSnapshot.listingStatus) {
    changes.push({ changeType: "listing_status_changed", previousValue: previousSnapshot.listingStatus, currentValue: currentSnapshot.listingStatus });
  }

  return { hasChanges: changes.length > 0, changes };
}
