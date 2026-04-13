import type { Prisma } from "@prisma/client";
import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampInt } from "@/lib/quality/validators";

export type PricingScoreResult = { score: number; detail: Prisma.InputJsonValue };

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export async function computePricingScoreComponent(listingId: string): Promise<PricingScoreResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      nightPriceCents: true,
      city: true,
      beds: true,
      maxGuests: true,
      listingStatus: true,
    },
  });
  if (!listing) {
    return { score: 50, detail: { error: "listing_not_found" } };
  }

  const latestSnap = await prisma.listingPricingSnapshot.findFirst({
    where: { listingId },
    orderBy: { capturedAt: "desc" },
    select: {
      suggestedPrice: true,
      appliedPrice: true,
      competitionScore: true,
    },
  });

  const peers = await prisma.shortTermListing.findMany({
    where: {
      city: listing.city,
      listingStatus: ListingStatus.PUBLISHED,
      id: { not: listingId },
    },
    select: { nightPriceCents: true },
    take: 60,
  });
  const peerPrices = peers.map((p) => p.nightPriceCents).filter((n) => n > 0);
  const med = median(peerPrices);
  const own = listing.nightPriceCents;

  let score = 55;
  const detail: Record<string, unknown> = {
    ownNightCents: own,
    peerMedianCents: med,
    engine: "listing_pricing_v1",
  };

  if (med != null && med > 0) {
    const ratio = own / med;
    if (ratio >= 0.85 && ratio <= 1.12) score = 88;
    else if (ratio >= 0.75 && ratio <= 1.25) score = 76;
    else if (ratio >= 0.65 && ratio <= 1.4) score = 62;
    else if (ratio < 0.65) score = 48;
    else score = 52;
    detail.priceVsPeerMedian = ratio;
  }

  if (latestSnap?.suggestedPrice != null && latestSnap.suggestedPrice > 0) {
    const sug = latestSnap.suggestedPrice;
    const drift = Math.abs(own / 100 - sug) / sug;
    detail.pricingSnapshotDrift = drift;
    if (drift <= 0.08) score = Math.min(100, score + 6);
    else if (drift > 0.35) score = Math.max(15, score - 12);
  }

  if (latestSnap?.competitionScore != null) {
    const c = latestSnap.competitionScore;
    detail.competitionScore = c;
    score = clampInt(score * 0.72 + c * 28, 0, 100);
  }

  return {
    score: clampInt(score, 0, 100),
    detail: detail as Prisma.InputJsonValue,
  };
}
