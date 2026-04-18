import { prisma } from "@/lib/db";
import { MIN_COMPARABLE_LISTINGS } from "@/src/modules/revenue/revenue.constants";

export type FsboPricingSignals = {
  listingId: string;
  city: string;
  priceCents: number;
  propertyType: string | null;
  listingDealType: string;
  updatedAt: Date;
  medianPeerPriceCents: number | null;
  peerSampleSize: number;
  viewCount: number;
  leadCount: number;
  trustScore: number | null;
};

export async function loadFsboPricingSignals(listingId: string): Promise<FsboPricingSignals | null> {
  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      _count: { select: { buyerListingViews: true, leads: true } },
    },
  });
  if (!row) return null;

  const peers = await prisma.fsboListing.findMany({
    where: {
      city: { equals: row.city, mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      id: { not: listingId },
      propertyType: row.propertyType ? { equals: row.propertyType } : undefined,
    },
    select: { priceCents: true },
    take: 400,
  });

  const prices = peers.map((p) => p.priceCents).filter((p) => p > 0);
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length >= MIN_COMPARABLE_LISTINGS
      ? sorted.length % 2
        ? sorted[mid]!
        : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
      : null;

  return {
    listingId: row.id,
    city: row.city,
    priceCents: row.priceCents,
    propertyType: row.propertyType,
    listingDealType: row.listingDealType,
    updatedAt: row.updatedAt,
    medianPeerPriceCents: median,
    peerSampleSize: peers.length,
    viewCount: row._count.buyerListingViews,
    leadCount: row._count.leads,
    trustScore: row.trustScore,
  };
}

function percentileSorted(sorted: number[], p: number): number | null {
  const n = sorted.length;
  if (n === 0) return null;
  const idx = (n - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! * (hi - idx) + sorted[hi]! * (idx - lo);
}

export type FsboPricingSignalsExtended = FsboPricingSignals & {
  p25PeerPriceCents: number | null;
  p75PeerPriceCents: number | null;
  photoCount: number;
  /** For competitiveness score helper — same peer set as percentiles. */
  peerPricesCents: number[];
};

/** Internal peer prices + percentiles for Pricing Engine v2 (same city/type filters as v1). */
export async function loadFsboPricingSignalsExtended(listingId: string): Promise<FsboPricingSignalsExtended | null> {
  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: {
      _count: { select: { buyerListingViews: true, leads: true } },
    },
  });
  if (!row) return null;

  const peers = await prisma.fsboListing.findMany({
    where: {
      city: { equals: row.city, mode: "insensitive" },
      status: "ACTIVE",
      moderationStatus: "APPROVED",
      id: { not: listingId },
      propertyType: row.propertyType ? { equals: row.propertyType } : undefined,
    },
    select: { priceCents: true },
    take: 400,
  });

  const prices = peers.map((p) => p.priceCents).filter((p) => p > 0);
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length >= MIN_COMPARABLE_LISTINGS
      ? sorted.length % 2
        ? sorted[mid]!
        : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2)
      : null;

  const p25 = sorted.length >= MIN_COMPARABLE_LISTINGS ? percentileSorted(sorted, 0.25) : null;
  const p75 = sorted.length >= MIN_COMPARABLE_LISTINGS ? percentileSorted(sorted, 0.75) : null;

  return {
    listingId: row.id,
    city: row.city,
    priceCents: row.priceCents,
    propertyType: row.propertyType,
    listingDealType: row.listingDealType,
    updatedAt: row.updatedAt,
    medianPeerPriceCents: median,
    p25PeerPriceCents: p25,
    p75PeerPriceCents: p75,
    peerSampleSize: peers.length,
    viewCount: row._count.buyerListingViews,
    leadCount: row._count.leads,
    trustScore: row.trustScore,
    photoCount: Array.isArray(row.images) ? row.images.length : 0,
    peerPricesCents: prices,
  };
}
