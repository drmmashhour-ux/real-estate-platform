/** Raw Syria rows — numeric fields coerced server-side (deterministic). */

export type SyriaListingRow = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  type: string;
  city: string;
  ownerId: string;
  status: string;
  fraudFlag: boolean;
  isFeatured: boolean;
  featuredUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SyriaUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
};

export type SyriaListingsSummary = {
  totalProperties: number;
  publishedProperties: number;
  fraudFlaggedProperties: number;
  totalBookings: number;
  bookingGrossHint: number | null;
  payoutsPendingHint: number;
  payoutsPaidHint: number;
};

export type SyriaBookingStatsForListing = {
  bookingCount: number;
  bookingsWithFraudFlag: number;
  guestPaidCount: number;
  payoutPendingCount: number;
  payoutPaidCount: number;
  sumTotalPriceHint: number | null;
};

export type SyriaUserStats = {
  userId: string;
  propertiesOwned: number;
  guestBookings: number;
  hostPayoutsPending: number;
};
