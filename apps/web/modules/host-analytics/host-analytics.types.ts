import type { BookingStatus } from "@prisma/client";

/** Single point for revenue / occupancy time series (UTC day bucket). */
export type HostAnalyticsTimePoint = {
  key: string;
  label: string;
  revenueCents: number;
  occupiedNights: number;
};

export type HostRevenueBreakdownCents = {
  /** Nightly stay subtotal (excludes per-stay cleaning allocation). */
  baseNightlyCents: number;
  /** Cleaning fees attributed from listing `cleaningFeeCents` (capped by booking total). */
  cleaningCents: number;
  /** Guest-paid platform service fees (`Booking.guestFeeCents`). */
  guestServiceFeeCents: number;
};

export type HostListingAnalyticsRow = {
  listingId: string;
  title: string;
  listingCode: string;
  revenueCents: number;
  occupiedNights: number;
  availableNights: number;
  occupancyRate: number | null;
  avgNightlyRateCents: number | null;
  bookingCount: number;
};

export type HostRevenueMetrics = {
  range: { startUtc: string; endUtc: string; days: number };
  listingCount: number;
  /** Sum of host-side payouts / booking totals for qualifying stays overlapping the window. */
  totalRevenueCents: number;
  revenueByMonth: Array<{ monthKey: string; label: string; revenueCents: number }>;
  occupancyRate: number | null;
  /** Occupied guest-nights in range / available guest-nights (published listings). */
  occupiedNights: number;
  availableNights: number;
  avgNightlyRateCents: number | null;
  /** Inquiries created in range → confirmed/completed bookings created in range (see explanation). */
  bookingConversionRate: number | null;
  cancellationRate: number | null;
  breakdown: HostRevenueBreakdownCents;
  series: {
    daily: HostAnalyticsTimePoint[];
    weekly: HostAnalyticsTimePoint[];
    monthly: HostAnalyticsTimePoint[];
  };
  listingBreakdown: HostListingAnalyticsRow[];
  /** Qualifying booking statuses for revenue (realized or confirmed). */
  revenueStatuses: BookingStatus[];
  metricExplanations: Record<string, string>;
};

export type HostRevenueInsight = {
  id: string;
  severity: "info" | "opportunity" | "watch";
  title: string;
  detail: string;
  /** Grounding: which real fields triggered this (no synthetic projections). */
  basis: string;
};
