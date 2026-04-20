/** Pure types — Syria regional data normalized for global LECIPM surfaces (no runtime logic). */

export type SyriaNormalizedListing = {
  id: string;
  source: "syria";
  regionCode: "sy";
  /** Primary / Arabic-first display (for global cards; use `titleEn` for English when present). */
  title: string;
  description: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string;
  descriptionEn: string | null;
  price: number | null;
  currency: string;
  listingType: string;
  city: string;
  cityAr: string | null;
  cityEn: string | null;
  districtAr: string | null;
  districtEn: string | null;
  /** e.g. en_title_present, en_description_absent */
  localizationNotes: string[];
  ownerId: string;
  status: string;
  fraudFlag: boolean;
  isFeatured: boolean;
  featuredUntil: string | null;
  bookingCountHint: number | null;
  payoutStateHint: "unknown" | "mixed" | "pending_heavy" | "clear";
  createdAt: string;
  updatedAt: string;
};

export type SyriaNormalizedBooking = {
  id: string;
  source: "syria";
  regionCode: "sy";
  propertyId: string;
  guestId: string;
  totalPriceHint: number | null;
  currency: string;
  bookingStatus: string;
  guestPaymentStatus: string;
  payoutStatus: string;
  fraudFlag: boolean;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  updatedAt: string;
};

export type SyriaNormalizedUser = {
  id: string;
  source: "syria";
  regionCode: "sy";
  email: string;
  name: string | null;
  role: string;
  propertiesOwned: number;
  guestBookings: number;
  hostPayoutsPending: number;
  createdAt: string;
};

export type SyriaNormalizedPayout = {
  id: string;
  source: "syria";
  regionCode: "sy";
  bookingId: string;
  hostId: string;
  amountHint: number | null;
  platformFeeHint: number | null;
  currency: string;
  status: string;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Aggregate region snapshot (counts + hints only — no PII beyond aggregates). */
export type SyriaRegionSummary = {
  totalListings: number;
  pendingReviewListings: number;
  featuredListings: number;
  fraudFlaggedListings: number;
  /** Published listings with `updated_at` older than the stale threshold (see docs). */
  stalePublishedListings: number;
  totalBookings: number;
  cancelledBookings: number;
  bnhubStaysListings: number;
  bookingGrossHint: number | null;
  payoutsPending: number;
  payoutsApproved: number;
  payoutsPaid: number;
  listingPaymentsVerifiedHint: number;
  computedAt: string;
};
