import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MIN_COMPARABLE_LISTINGS } from "@/src/modules/revenue/revenue.constants";

function percentileSorted(sorted: number[], p: number): number | null {
  const n = sorted.length;
  if (n === 0) return null;
  const idx = (n - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! * (hi - idx) + sorted[hi]! * (idx - lo);
}

export type StrPeerNightStats = {
  listingId: string;
  city: string;
  nightPriceCents: number;
  peerSampleSize: number;
  medianPeerCents: number | null;
  p25Cents: number | null;
  p75Cents: number | null;
  completedStays: number;
};

/** Internal STR peers in same city (published) — not an external comp set claim. */
export async function loadStrPeerNightStats(listingId: string): Promise<StrPeerNightStats | null> {
  const row = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      city: true,
      nightPriceCents: true,
      bnhubListingCompletedStays: true,
    },
  });
  if (!row) return null;

  const peers = await prisma.shortTermListing.findMany({
    where: {
      listingStatus: ListingStatus.PUBLISHED,
      city: { equals: row.city, mode: "insensitive" },
      id: { not: listingId },
    },
    select: { nightPriceCents: true },
    take: 400,
  });

  const prices = peers.map((p) => p.nightPriceCents).filter((p) => p > 0);
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
    nightPriceCents: row.nightPriceCents,
    peerSampleSize: peers.length,
    medianPeerCents: median,
    p25Cents: p25,
    p75Cents: p75,
    completedStays: row.bnhubListingCompletedStays,
  };
}
