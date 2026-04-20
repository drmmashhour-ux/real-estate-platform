import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

/** High intent = growth events + leads combined proxy (deterministic). */
export const highInterestNoBookingDetector: DarlinkMarketplaceDetector = {
  id: "high_interest_no_booking",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      const viewsByProp: Record<string, number> = {};
      const et = snapshot.growthMetrics?.eventsByType ?? {};
      const listingViewish =
        (et["listing_view"] ?? 0) +
        (et["listing_detail_view"] ?? 0) +
        (et["property_view"] ?? 0);
      const leadsByProp = new Map<string, number>();
      for (const l of snapshot.leads) {
        leadsByProp.set(l.propertyId, (leadsByProp.get(l.propertyId) ?? 0) + 1);
      }
      const bookingsByProp = new Map<string, number>();
      for (const b of snapshot.bookings) {
        bookingsByProp.set(b.propertyId, (bookingsByProp.get(b.propertyId) ?? 0) + 1);
      }

      for (const listing of snapshot.listings) {
        const pid = listing.id;
        const leads = leadsByProp.get(pid) ?? 0;
        const bookings = bookingsByProp.get(pid) ?? 0;
        const syntheticViews = listingViewish > 0 && snapshot.listings.length > 0 ? listingViewish / snapshot.listings.length : 0;
        viewsByProp[pid] = syntheticViews;

        if (bookings === 0 && leads >= 1 && (syntheticViews >= 3 || leads >= 3)) {
          const id = signalKey("high_interest", "listing", pid, "intent_without_conversion");
          out.push({
            id,
            type: "high_interest",
            severity: leads >= 3 ? "critical" : "warning",
            entityType: "listing",
            entityId: pid,
            reasonCode: "intent_without_conversion",
            metrics: { leads, syntheticViewShare: Math.round(syntheticViews * 100) / 100 },
            explanation: "Strong interest signals without a booking — review friction and trust badges.",
          });
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
