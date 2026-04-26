import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

const STALE_DAYS = 60;

export const staleListingDetector: DarlinkMarketplaceDetector = {
  id: "stale_listing",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const now = Date.now();
      for (const l of snapshot.listings) {
        if (l.status !== "PUBLISHED") continue;
        const updated = new Date(l.updatedAt).getTime();
        const days = Math.floor((now - updated) / 86400000);
        if (days >= STALE_DAYS) {
          const id = signalKey("stale_listing", "listing", l.id, "old_update");
          out.push({
            id,
            type: "stale_listing",
            severity: days >= 120 ? "warning" : "info",
            entityType: "listing",
            entityId: l.id,
            reasonCode: "old_update",
            metrics: { daysSinceUpdate: days },
            explanation: "Published listing has not been refreshed recently — stale inventory risk.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
