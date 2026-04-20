/**
 * BNHub listing + portfolio KPIs from `Booking` rows (platform source of truth).
 *
 * Definitions (UTC):
 * - Window: check-in falls in `[windowStart, windowEndExclusive)` from `bnhubUtcWindowInclusiveEnd`.
 * - Gross revenue: Σ `totalCents / 100` for counted bookings (excludes cancelled-like statuses).
 * - Occupied nights: Σ `Booking.nights` for those bookings.
 * - Available nights (single unit each listing): days in inclusive window × 1 listing.
 * - Portfolio available nights: sum of listing available nights (listings counted once each).
 */

import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ListingRevenueMetrics, PortfolioRevenueMetrics } from "./bnhub-revenue.types";
import { addUtcDays, bnhubUtcWindowInclusiveEnd, round2, safeDivide, startOfUtcDay } from "./bnhub-revenue-math";
import { bookingCountsTowardBnhubRevenue } from "./bnhub-revenue-booking-filters";

export type RangeInput = {
  start: Date;
  /** Inclusive UTC calendar day end — same day semantics as dashboard date pickers. */
  end: Date;
};

function aggregateCurrency(currencies: string[]): { displayCurrency: string | null; mixedCurrencyWarning: boolean } {
  const uniq = [...new Set(currencies.filter(Boolean))];
  if (uniq.length <= 1) {
    return { displayCurrency: uniq[0] ?? "USD", mixedCurrencyWarning: false };
  }
  return { displayCurrency: null, mixedCurrencyWarning: true };
}

export async function getListingRevenueMetrics(
  listingId: string,
  range: RangeInput
): Promise<ListingRevenueMetrics | null> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      currency: true,
      bookings: {
        select: {
          checkIn: true,
          nights: true,
          totalCents: true,
          status: true,
        },
      },
    },
  });

  if (!listing) return null;

  const { windowStart, windowEndExclusive, availableNightsSingleUnit } = bnhubUtcWindowInclusiveEnd(range.start, range.end);

  const validBookings = listing.bookings.filter(
    (b) =>
      bookingCountsTowardBnhubRevenue(b.status) &&
      b.checkIn >= windowStart &&
      b.checkIn < windowEndExclusive
  );

  const grossRevenueCents = validBookings.reduce((sum, b) => sum + b.totalCents, 0);
  const occupiedNights = validBookings.reduce((sum, b) => sum + b.nights, 0);
  const availableNights = availableNightsSingleUnit;

  const grossRevenue = round2(grossRevenueCents / 100);
  const occupancyRate = round2(safeDivide(occupiedNights, availableNights));
  const adr = round2(safeDivide(grossRevenue, occupiedNights));
  const revpar = round2(safeDivide(grossRevenue, availableNights));

  return {
    listingId: listing.id,
    listingTitle: listing.title,
    currency: listing.currency ?? "USD",
    bookingCount: validBookings.length,
    grossRevenue,
    occupiedNights,
    availableNights,
    occupancyRate,
    adr,
    revpar,
  };
}

export async function getPortfolioRevenueMetrics(hostUserId: string, range: RangeInput): Promise<PortfolioRevenueMetrics> {
  const listings = await prisma.shortTermListing.findMany({
    where: {
      ownerId: hostUserId,
      listingStatus: ListingStatus.PUBLISHED,
    },
    select: {
      currency: true,
      bookings: {
        select: {
          checkIn: true,
          nights: true,
          totalCents: true,
          status: true,
        },
      },
    },
  });

  let bookingCount = 0;
  let grossRevenueCents = 0;
  let occupiedNights = 0;
  let availableNights = 0;

  const { windowStart, windowEndExclusive, availableNightsSingleUnit } = bnhubUtcWindowInclusiveEnd(range.start, range.end);

  for (const listing of listings) {
    availableNights += availableNightsSingleUnit;

    const validBookings = listing.bookings.filter(
      (b) =>
        bookingCountsTowardBnhubRevenue(b.status) &&
        b.checkIn >= windowStart &&
        b.checkIn < windowEndExclusive
    );

    bookingCount += validBookings.length;
    grossRevenueCents += validBookings.reduce((s, b) => s + b.totalCents, 0);
    occupiedNights += validBookings.reduce((s, b) => s + b.nights, 0);
  }

  const grossRevenue = round2(grossRevenueCents / 100);
  const occupancyRate = round2(safeDivide(occupiedNights, availableNights));
  const adr = round2(safeDivide(grossRevenue, occupiedNights));
  const revpar = round2(safeDivide(grossRevenue, availableNights));

  const currencies = listings.map((l) => l.currency ?? "USD");
  const cur = aggregateCurrency(currencies);

  return {
    listingCount: listings.length,
    bookingCount,
    grossRevenue,
    occupiedNights,
    availableNights,
    occupancyRate,
    adr,
    revpar,
    displayCurrency: cur.displayCurrency,
    mixedCurrencyWarning: cur.mixedCurrencyWarning,
  };
}

export async function getRevenueDashboardSummary(hostUserId: string): Promise<{
  portfolio: PortfolioRevenueMetrics;
  listings: ListingRevenueMetrics[];
}> {
  const today = startOfUtcDay(new Date());
  const startRange = addUtcDays(today, -29);

  const listings = await prisma.shortTermListing.findMany({
    where: { ownerId: hostUserId, listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
    orderBy: { updatedAt: "desc" },
  });

  const range = { start: startRange, end: today };
  const portfolio = await getPortfolioRevenueMetrics(hostUserId, range);

  const listingMetrics = (
    await Promise.all(listings.map((l) => getListingRevenueMetrics(l.id, range)))
  ).filter(Boolean) as ListingRevenueMetrics[];

  return { portfolio, listings: listingMetrics };
}
