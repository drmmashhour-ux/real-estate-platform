import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

export const inactiveInventoryDetector: DarlinkMarketplaceDetector = {
  id: "inactive_inventory",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const bookingsByProp = new Map<string, number>();
      for (const b of snapshot.bookings) {
        bookingsByProp.set(b.propertyId, (bookingsByProp.get(b.propertyId) ?? 0) + 1);
      }
      for (const l of snapshot.listings) {
        if (l.status !== "PUBLISHED" || l.type !== "BNHUB") continue;
        const bc = bookingsByProp.get(l.id) ?? 0;
        if (bc === 0) {
          const id = signalKey("inactive_inventory", "listing", l.id, "bnhub_no_bookings");
          out.push({
            id,
            type: "inactive_inventory",
            severity: "info",
            entityType: "listing",
            entityId: l.id,
            reasonCode: "bnhub_no_bookings",
            metrics: { bookings: bc },
            explanation: "Published BNHub listing with no bookings in snapshot window — visibility boost candidate.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
