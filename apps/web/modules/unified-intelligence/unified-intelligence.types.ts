/** Cross-app listing intelligence — Syria is isolated by `source` + `regionCode`; web remains default path. */

import type { RegionListingRef } from "@/modules/integrations/regions/region-listing-key.types";

export type UnifiedListingSource = "web" | "syria" | "external";

export type UnifiedListingSourceStatusKey = "syria" | "web";

export type ListingSourceAvailability = "available" | "missing";

export type UnifiedListingIntelligence = {
  listingId: string;
  source: UnifiedListingSource;
  /** Stable cross-region identity when `FEATURE_REGION_LISTING_KEY_V1` is enabled. */
  regionListingRef: RegionListingRef | null;
  regionCode?: string;
  priceHint: number | null;
  currencyHint: string | null;
  statusHint: string | null;
  fraudFlag: boolean;
  featuredHint: boolean;
  bookingCounts: {
    total: number;
    fraudBookings: number;
    guestPaid: number;
    payoutPending: number;
    payoutPaid: number;
    cancelled: number;
  };
  payoutPipeline: {
    pendingHint: number;
    paidHint: number;
    approvedHint: number;
    notes: string[];
  };
  /** Syrian aggregate admin snapshot when source is Syria (optional subset). */
  syriaRegionSummaryAttached: boolean;
  sourceStatus: Partial<Record<UnifiedListingSourceStatusKey, ListingSourceAvailability>>;
  availabilityNotes: string[];
};
