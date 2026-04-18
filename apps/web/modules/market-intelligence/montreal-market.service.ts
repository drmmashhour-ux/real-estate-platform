/**
 * Aggregates BNHub + CRM signals for Greater Montreal listings (host-provided geography).
 */

import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { BookingStatus } from "@prisma/client";
import type { MontrealMarketSnapshot, MontrealNeighborhoodSegment } from "./market-intelligence.types";
import { bucketNeighborhood, nightPriceToBand, prismaWhereMontrealShortTerm } from "./neighborhood-clustering.service";
import { buildOpportunityRows } from "./supply-gap.service";

const WINDOW_DAYS = 90;

const BOOKING_WINDOW_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.AWAITING_HOST_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

function segmentKey(neighborhood: string, propertyType: string | null, priceBand: string): string {
  return `${neighborhood}||${propertyType ?? "unknown"}||${priceBand}`;
}

export async function buildMontrealMarketSnapshot(): Promise<MontrealMarketSnapshot> {
  const since = subDays(new Date(), WINDOW_DAYS);
  const baseWhere = prismaWhereMontrealShortTerm();

  const listings = await prisma.shortTermListing.findMany({
    where: baseWhere,
    select: {
      id: true,
      municipality: true,
      neighborhoodDetails: true,
      address: true,
      propertyType: true,
      nightPriceCents: true,
      listingStatus: true,
      bnhubListingCompletedStays: true,
    },
  });

  const listingIds = listings.map((l) => l.id);

  const bookingAgg = listingIds.length
    ? await prisma.booking.groupBy({
        by: ["listingId"],
        where: {
          listingId: { in: listingIds },
          createdAt: { gte: since },
          status: { in: BOOKING_WINDOW_STATUSES },
        },
        _count: { _all: true },
      })
    : [];

  const bookingsByListing = new Map<string, number>();
  for (const row of bookingAgg) {
    bookingsByListing.set(row.listingId, row._count._all);
  }

  const leadAgg = listingIds.length
    ? await prisma.lead.groupBy({
        by: ["shortTermListingId"],
        where: {
          shortTermListingId: { in: listingIds },
          createdAt: { gte: since },
        },
        _count: { _all: true },
      })
    : [];

  const leadsByListing = new Map<string, number>();
  for (const row of leadAgg) {
    if (row.shortTermListingId) leadsByListing.set(row.shortTermListingId, row._count._all);
  }

  type Agg = {
    listingCount: number;
    publishedListingCount: number;
    nightSum: number;
    nightN: number;
    bookingCount90d: number;
    inquiryCount90d: number;
    completedStays: number;
  };

  const map = new Map<string, Agg>();

  for (const l of listings) {
    const neighborhood = bucketNeighborhood({
      municipality: l.municipality,
      neighborhoodDetails: l.neighborhoodDetails,
      address: l.address,
    });
    const pt = l.propertyType?.trim() || null;
    const band = nightPriceToBand(l.nightPriceCents);
    const key = segmentKey(neighborhood, pt, band);
    const prev = map.get(key) ?? {
      listingCount: 0,
      publishedListingCount: 0,
      nightSum: 0,
      nightN: 0,
      bookingCount90d: 0,
      inquiryCount90d: 0,
      completedStays: 0,
    };

    prev.listingCount += 1;
    if (l.listingStatus === ListingStatus.PUBLISHED) {
      prev.publishedListingCount += 1;
      prev.nightSum += l.nightPriceCents;
      prev.nightN += 1;
    }
    prev.bookingCount90d += bookingsByListing.get(l.id) ?? 0;
    prev.inquiryCount90d += leadsByListing.get(l.id) ?? 0;
    prev.completedStays += l.bnhubListingCompletedStays ?? 0;
    map.set(key, prev);
  }

  const segments: MontrealNeighborhoodSegment[] = [];

  for (const [key, agg] of map) {
    const [neighborhood, propertyType, priceBand] = key.split("||");
    const avgNightPriceCents =
      agg.nightN > 0 ? Math.round(agg.nightSum / agg.nightN) : null;
    const conversionProxy =
      agg.publishedListingCount > 0 ? agg.completedStays / agg.publishedListingCount : 0;

    segments.push({
      neighborhood,
      propertyType: propertyType === "unknown" ? null : propertyType,
      priceBand: priceBand as MontrealNeighborhoodSegment["priceBand"],
      listingCount: agg.listingCount,
      publishedListingCount: agg.publishedListingCount,
      bookingCount90d: agg.bookingCount90d,
      inquiryCount90d: agg.inquiryCount90d,
      avgNightPriceCents,
      conversionProxy: Math.round(conversionProxy * 1000) / 1000,
    });
  }

  const opportunities = buildOpportunityRows(segments).sort((a, b) => b.opportunityScore - a.opportunityScore);

  const disclaimers = [
    "Scores are relative ranks inside your platform data for Montréal-shaped listings — not city-wide market share.",
    "Demand uses BNHub bookings and CRM leads tied to stays; it does not include off-platform OTAs.",
    "Neighborhood labels depend on host-entered municipality and text fields; validate before running paid campaigns.",
  ];

  return {
    market: "Montreal",
    generatedAt: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    segments: [...segments].sort((a, b) => b.bookingCount90d - a.bookingCount90d),
    opportunities,
    disclaimers,
  };
}
