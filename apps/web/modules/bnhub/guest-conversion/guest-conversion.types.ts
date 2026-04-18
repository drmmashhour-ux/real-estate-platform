/**
 * BNHub guest-side conversion layer — advisory metrics only (V8 safe).
 * No booking, payment, ranking, or listing mutation semantics.
 */

export type BNHubGuestConversionStatus = "weak" | "watch" | "healthy" | "strong";

export type BNHubSearchConversionMetrics = {
  impressions?: number;
  clicks?: number;
  clickThroughRate?: number;
};

export type BNHubListingConversionMetrics = {
  listingViews?: number;
  bookingStarts?: number;
  bookingCompletions?: number;
  viewToStartRate?: number;
  startToBookingRate?: number;
};

export type BNHubBookingFrictionSignal = {
  title: string;
  severity: "low" | "medium" | "high";
  why: string;
};

export type BNHubGuestConversionRecommendation = {
  id: string;
  category: "search" | "listing_page" | "booking_flow" | "trust" | "pricing";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  why: string;
};

export type BNHubGuestConversionSummary = {
  listingId?: string;
  searchMetrics?: BNHubSearchConversionMetrics;
  listingMetrics?: BNHubListingConversionMetrics;
  status: BNHubGuestConversionStatus;
  weakSignals: string[];
  strongSignals: string[];
  frictionSignals: BNHubBookingFrictionSignal[];
  recommendations: BNHubGuestConversionRecommendation[];
  createdAt: string;
};

/** Internal bundle for friction + recommendations (deterministic). */
export type GuestConversionFrictionContext = {
  listingId: string;
  windowDays: number;
  searchMetrics: BNHubSearchConversionMetrics;
  listingMetrics: BNHubListingConversionMetrics;
  reviewCount: number;
  photoCount: number;
  hasDescription: boolean;
  nightPriceCents: number;
};
