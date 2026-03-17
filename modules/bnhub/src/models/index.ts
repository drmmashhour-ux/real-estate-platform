/**
 * BNHub domain models (types). Persistence lives in packages/database or app Prisma schema.
 */

export type BNHubListing = {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  propertyType?: string;
  roomType?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  maxGuests: number;
  bedrooms?: number;
  beds: number;
  bathrooms: number;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  securityDepositCents: number;
  minimumStay?: number;
  maximumStay?: number;
  instantBookEnabled: boolean;
  cancellationPolicy?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BNHubAvailability = {
  id: string;
  listingId: string;
  date: Date;
  isAvailable: boolean;
  priceOverrideCents?: number;
};

export type BNHubBooking = {
  id: string;
  listingId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  subtotalCents: number;
  feesCents: number;
  totalPriceCents: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: Date;
};

export type BNHubReview = {
  id: string;
  listingId: string;
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
};
