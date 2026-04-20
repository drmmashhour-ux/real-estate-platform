/**
 * Loads BNHub metric snapshots + platform roll-ups for deterministic narratives.
 */

import { type BnhubRevenueMetricSnapshot, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { RangeInput } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import { getListingRevenueMetrics } from "@/modules/bnhub-revenue/bnhub-revenue-dashboard.service";
import type { ListingRevenueMetrics } from "@/modules/bnhub-revenue/bnhub-revenue.types";
import { addUtcDays, round2, safeDivide, startOfUtcDay } from "@/modules/bnhub-revenue/bnhub-revenue-math";
import type { NarrativeMetricsSlice } from "./narrative.types";

export async function getLatestTwoPortfolioSnapshots(scopeId: string): Promise<{
  current: BnhubRevenueMetricSnapshot | null;
  previous: BnhubRevenueMetricSnapshot | null;
}> {
  const rows = await prisma.bnhubRevenueMetricSnapshot.findMany({
    where: { scopeType: "portfolio", scopeId },
    orderBy: { snapshotDate: "desc" },
    take: 2,
  });
  return { current: rows[0] ?? null, previous: rows[1] ?? null };
}

export function mapBnhubSnapshotToMetrics(s: {
  grossRevenue: number;
  bookingCount: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  occupiedNights: number;
  availableNights: number;
}): NarrativeMetricsSlice {
  return {
    grossRevenue: s.grossRevenue,
    bookingCount: s.bookingCount,
    occupancyRate: s.occupancyRate,
    adr: s.adr,
    revpar: s.revpar,
    occupiedNights: s.occupiedNights,
    availableNights: s.availableNights,
  };
}

function rollupListingMetrics(rows: ListingRevenueMetrics[]): NarrativeMetricsSlice {
  let grossRevenue = 0;
  let bookingCount = 0;
  let occupiedNights = 0;
  let availableNights = 0;
  for (const m of rows) {
    grossRevenue += m.grossRevenue;
    bookingCount += m.bookingCount;
    occupiedNights += m.occupiedNights;
    availableNights += m.availableNights;
  }
  const occupancyRate = round2(safeDivide(occupiedNights, availableNights));
  const adr = round2(safeDivide(grossRevenue, occupiedNights));
  const revpar = round2(safeDivide(grossRevenue, availableNights));
  return {
    grossRevenue: round2(grossRevenue),
    bookingCount,
    occupancyRate,
    adr,
    revpar,
    occupiedNights,
    availableNights,
  };
}

/** Aggregates published BNHub listings using the same booking-window rules as the host dashboard. */
export async function aggregatePlatformPublishedMetrics(range: RangeInput): Promise<NarrativeMetricsSlice> {
  const listings = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    select: { id: true },
  });

  const rows = (
    await Promise.all(listings.map((l) => getListingRevenueMetrics(l.id, range)))
  ).filter(Boolean) as ListingRevenueMetrics[];

  return rollupListingMetrics(rows);
}

/** Calendar-aligned 30-day vs prior 30-day slices for investor macro narrative. */
export async function getInvestorPlatformMetricPair(): Promise<{
  current: NarrativeMetricsSlice;
  previous: NarrativeMetricsSlice;
}> {
  const today = startOfUtcDay(new Date());
  const currentRange: RangeInput = { start: addUtcDays(today, -29), end: today };
  const previousRange: RangeInput = { start: addUtcDays(today, -59), end: addUtcDays(today, -30) };

  const [current, previous] = await Promise.all([
    aggregatePlatformPublishedMetrics(currentRange),
    aggregatePlatformPublishedMetrics(previousRange),
  ]);

  return { current, previous };
}
