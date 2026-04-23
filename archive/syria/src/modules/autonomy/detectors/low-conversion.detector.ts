import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

const LEADS_MIN = 2;

export const lowConversionDetector: DarlinkMarketplaceDetector = {
  id: "low_conversion",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const bookingsByProp = new Map<string, number>();
      for (const b of snapshot.bookings) {
        bookingsByProp.set(b.propertyId, (bookingsByProp.get(b.propertyId) ?? 0) + 1);
      }
      const leadsByProp = new Map<string, number>();
      for (const l of snapshot.leads) {
        leadsByProp.set(l.propertyId, (leadsByProp.get(l.propertyId) ?? 0) + 1);
      }
      for (const [propertyId, leadCount] of leadsByProp.entries()) {
        const bc = bookingsByProp.get(propertyId) ?? 0;
        if (leadCount >= LEADS_MIN && bc === 0) {
          const id = signalKey("low_conversion", "listing", propertyId, "leads_without_booking");
          out.push({
            id,
            type: "low_conversion",
            severity: "warning",
            entityType: "listing",
            entityId: propertyId,
            reasonCode: "leads_without_booking",
            metrics: { leads: leadCount, bookings: bc },
            explanation: "Multiple inquiries recorded without a booking — review pricing and response time.",
          });
        }
      }
    } catch {
      /* deterministic empty */
    }
    return out;
  },
};
