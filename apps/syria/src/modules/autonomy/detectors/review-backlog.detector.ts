import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

export const reviewBacklogDetector: DarlinkMarketplaceDetector = {
  id: "review_backlog",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const n = snapshot.aggregates.pendingReviewListings;
      if (n > 0) {
        const id = signalKey("review_backlog", "listing", null, "aggregate_pending");
        out.push({
          id,
          type: "review_backlog",
          severity: n >= 10 ? "critical" : n >= 3 ? "warning" : "info",
          entityType: "listing",
          entityId: null,
          reasonCode: "aggregate_pending",
          metrics: { pendingReviewListings: n },
          explanation: "Listings are waiting in pending review — moderation backlog.",
        });
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
