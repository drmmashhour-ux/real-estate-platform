export type WatchlistSnapshotState = {
  id: string;
  userId: string;
  listingId: string;
  dealScore: number | null;
  trustScore: number | null;
  fraudScore: number | null;
  confidence: number | null;
  recommendation: string | null;
  price: number | null;
  listingStatus: string | null;
  createdAt: Date;
};

export type WatchlistSnapshotChangeType =
  | "price_changed"
  | "deal_score_changed"
  | "trust_score_changed"
  | "fraud_score_changed"
  | "confidence_changed"
  | "recommendation_changed"
  | "listing_status_changed";

export type WatchlistSnapshotChange = {
  changeType: WatchlistSnapshotChangeType;
  previousValue: string | number | null;
  currentValue: string | number | null;
};

export type WatchlistSnapshotComparison = {
  hasChanges: boolean;
  changes: WatchlistSnapshotChange[];
};
