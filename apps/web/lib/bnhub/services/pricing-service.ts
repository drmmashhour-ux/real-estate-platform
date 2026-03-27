/**
 * BNHub PricingService — calculate nightly cost, cleaning fee, taxes, platform fee, total.
 * Returns full price breakdown.
 */

import {
  computeBookingPricing,
  guestTotal,
  hostPayout,
  type PricingBreakdown,
} from "@/lib/bnhub/booking-pricing";

export type { PricingBreakdown };

export const PricingService = {
  /**
   * Full price breakdown for a stay: nightly cost, cleaning fee, taxes, platform fee, total.
   */
  calculateBreakdown(params: {
    listingId: string;
    checkIn: string;
    checkOut: string;
    guestCount?: number;
  }) {
    return computeBookingPricing(params);
  },

  guestTotal(breakdown: PricingBreakdown) {
    return guestTotal(breakdown);
  },

  hostPayout(breakdown: PricingBreakdown) {
    return hostPayout(breakdown);
  },
};
