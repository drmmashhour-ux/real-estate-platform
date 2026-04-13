import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";

/** Seasonality multiplier by calendar month (1–12); mild curve for short-term demand. */
export function seasonalityMultiplier(month1to12: number): number {
  const m = Math.min(12, Math.max(1, Math.round(month1to12)));
  // Summer + late year travel bump (northern markets heuristic)
  const peaks: Record<number, number> = {
    1: 0.92,
    2: 0.94,
    3: 1.0,
    4: 1.04,
    5: 1.08,
    6: 1.12,
    7: 1.14,
    8: 1.12,
    9: 1.06,
    10: 1.04,
    11: 0.98,
    12: 1.02,
  };
  return peaks[m] ?? 1;
}

export type SmartPriceResult = {
  recommendedPriceCents: number;
  confidence: "low" | "medium" | "high";
  confidenceScore: number;
  marketAvgCents: number | null;
  /** Published peers in the same city (includes this listing in count). */
  peerListingCount: number;
  /** City-wide BNHUB booking starts (last 30d) used for demand ratio — same basis as demandLevel. */
  peerBookingsLast30d: number;
  demandLevel: "low" | "medium" | "high";
  factors: { seasonality: number; demandRatio: number };
};

/**
 * Pure helper for tests: blend listing price with market average and demand.
 */
const MAX_PEER_LISTING_COUNT = 50_000;

/** Clamp vs-peer percent for API/UI so tiny peer averages cannot explode displayed % . */
export const MAX_PERCENT_VS_PEER_DISPLAY = 400;

export function computeSmartPrice(input: {
  listingNightCents: number;
  marketAvgCents: number | null;
  peerBookingsLast30d: number;
  peerListingCount: number;
  month?: number;
}): SmartPriceResult {
  const listingNightCents = Number.isFinite(input.listingNightCents)
    ? Math.max(0, Math.round(input.listingNightCents))
    : 0;
  const marketAvgCents =
    input.marketAvgCents != null && Number.isFinite(input.marketAvgCents) && input.marketAvgCents > 0
      ? Math.round(input.marketAvgCents)
      : null;
  const peerBookingsLast30d = Number.isFinite(input.peerBookingsLast30d)
    ? Math.max(0, Math.floor(input.peerBookingsLast30d))
    : 0;
  const peerListingCount = Number.isFinite(input.peerListingCount)
    ? Math.min(MAX_PEER_LISTING_COUNT, Math.max(0, Math.floor(input.peerListingCount)))
    : 0;

  const month = input.month ?? new Date().getMonth() + 1;
  const season = seasonalityMultiplier(month);
  const denom = Math.max(1, peerListingCount);
  const demandRatio = peerBookingsLast30d / denom;
  let demandLevel: "low" | "medium" | "high" = "low";
  if (demandRatio >= 0.35) demandLevel = "high";
  else if (demandRatio >= 0.15) demandLevel = "medium";

  const demandAdj = demandLevel === "high" ? 1.06 : demandLevel === "medium" ? 1.02 : 0.98;
  const base =
    marketAvgCents != null && marketAvgCents > 0
      ? Math.round((listingNightCents * 0.45 + marketAvgCents * 0.55) * season * demandAdj)
      : Math.round(listingNightCents * season * demandAdj);

  const recommendedPriceCents = Math.max(100, base);

  let confidenceScore = 40;
  if (marketAvgCents != null && marketAvgCents > 0) confidenceScore += 25;
  if (peerListingCount >= 5) confidenceScore += 15;
  if (peerListingCount >= 15) confidenceScore += 10;
  if (demandLevel !== "low") confidenceScore += 10;
  confidenceScore = Math.min(100, confidenceScore);

  const confidence: SmartPriceResult["confidence"] =
    confidenceScore >= 75 ? "high" : confidenceScore >= 50 ? "medium" : "low";

  return {
    recommendedPriceCents,
    confidence,
    confidenceScore,
    marketAvgCents,
    peerListingCount,
    peerBookingsLast30d,
    demandLevel,
    factors: { seasonality: season, demandRatio },
  };
}

export async function generateSmartPrice(listingId: string): Promise<SmartPriceResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      city: true,
      nightPriceCents: true,
      listingStatus: true,
    },
  });
  if (!listing) throw new Error("Listing not found");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [agg, peerCount, bookingCount] = await Promise.all([
    prisma.shortTermListing.aggregate({
      where: {
        city: listing.city,
        listingStatus: ListingStatus.PUBLISHED,
        id: { not: listing.id },
      },
      _avg: { nightPriceCents: true },
    }),
    prisma.shortTermListing.count({
      where: { city: listing.city, listingStatus: ListingStatus.PUBLISHED },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: since },
        status: { in: ["CONFIRMED", "COMPLETED", "AWAITING_HOST_APPROVAL", "PENDING"] },
        listing: { city: listing.city, listingStatus: ListingStatus.PUBLISHED },
      },
    }),
  ]);

  const marketAvgCents =
    agg._avg.nightPriceCents != null ? Math.round(agg._avg.nightPriceCents) : null;

  return computeSmartPrice({
    listingNightCents: listing.nightPriceCents,
    marketAvgCents,
    peerBookingsLast30d: bookingCount,
    peerListingCount: peerCount,
    month: new Date().getMonth() + 1,
  });
}
