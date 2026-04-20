/**
 * BNHub revenue dashboard aggregates — dollar amounts match listing `currency` when stated.
 * Ratios (occupancy, ADR, RevPAR) follow definitions in service comments (UTC windows).
 */

export type ListingRevenueMetrics = {
  listingId: string;
  listingTitle: string;
  currency: string;
  bookingCount: number;
  /** Sum of `Booking.totalCents / 100` for counted stays in window. */
  grossRevenue: number;
  /** Sum of `Booking.nights` for counted stays whose check-in falls in the UTC window. */
  occupiedNights: number;
  /** One rentable unit × UTC calendar days in `[rangeStart, rangeEnd]` inclusive. */
  availableNights: number;
  /** occupiedNights / availableNights (0–1). */
  occupancyRate: number;
  /** grossRevenue / occupiedNights when occupiedNights > 0, else 0. */
  adr: number;
  /** grossRevenue / availableNights. */
  revpar: number;
};

export type PortfolioRevenueMetrics = {
  listingCount: number;
  bookingCount: number;
  grossRevenue: number;
  occupiedNights: number;
  availableNights: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  /** When all listings share one currency; null if mixed (totals still sum cents, footnote shown in UI). */
  displayCurrency: string | null;
  mixedCurrencyWarning: boolean;
};

export type BnhubRevenueDashboardShell = {
  portfolio: PortfolioRevenueMetrics;
  listings: ListingRevenueMetrics[];
};
