import { ListingStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "@repo/db";
import type { PricingAiListingInput, PricingAiSignalBundle } from "./signals.types";

export type CompetitorAdjustment = {
  competitorMultiplier: number;
  reasoning: string[];
};

function medianSorted(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0
    ? Math.round((nums[mid - 1]! + nums[mid]!) / 2)
    : nums[mid]!;
}

/**
 * Peer stats: same city, published, optional beds ±1 for “similar” cohort.
 */
export async function loadPeerMedians(
  listing: Pick<PricingAiListingInput, "id" | "city" | "beds">,
): Promise<{
  cityMedianCents: number | null;
  citySampleSize: number;
  similarMedianCents: number | null;
  similarSampleSize: number;
}> {
  const city = listing.city?.trim();
  if (!city) {
    return { cityMedianCents: null, citySampleSize: 0, similarMedianCents: null, similarSampleSize: 0 };
  }

  const baseWhere: Prisma.ShortTermListingWhereInput = {
    listingStatus: ListingStatus.PUBLISHED,
    city: { equals: city, mode: "insensitive" },
    id: { not: listing.id },
    nightPriceCents: { gt: 0 },
  };

  const cityRows = await prisma.shortTermListing.findMany({
    where: baseWhere,
    select: { nightPriceCents: true },
    take: 400,
  });
  const cityNums = cityRows.map((r) => r.nightPriceCents).sort((a, b) => a - b);

  const beds =
    listing.beds != null && Number.isFinite(listing.beds) ? Math.max(1, Math.round(Number(listing.beds))) : null;
  let similarNums: number[] = [];
  if (beds != null) {
    const similarRows = await prisma.shortTermListing.findMany({
      where: {
        ...baseWhere,
        beds: { gte: Math.max(1, beds - 1), lte: beds + 1 },
      },
      select: { nightPriceCents: true },
      take: 200,
    });
    similarNums = similarRows.map((r) => r.nightPriceCents).sort((a, b) => a - b);
  }

  return {
    cityMedianCents: medianSorted(cityNums),
    citySampleSize: cityNums.length,
    similarMedianCents: medianSorted(similarNums),
    similarSampleSize: similarNums.length,
  };
}

/**
 * Compare subject base to peer medians; keep moves modest and explainable.
 */
export function competitorPriceAdjustment(
  listing: Pick<PricingAiListingInput, "nightPriceCents">,
  signals: PricingAiSignalBundle,
): CompetitorAdjustment {
  const reasoning: string[] = [];
  const base = listing.nightPriceCents;
  const preferSimilar = signals.similarPropertySampleSize >= 5;
  const peer =
    preferSimilar && signals.similarPropertyMedianCents != null
      ? signals.similarPropertyMedianCents
      : signals.nearbyListingMedianCents;
  const n = preferSimilar ? signals.similarPropertySampleSize : signals.nearbyListingSampleSize;

  if (peer == null || peer <= 0 || n < 4) {
    reasoning.push(
      n < 4
        ? "Few comparable published listings in your city right now; comp signal is down-weighted."
        : "No reliable peer median yet; comp signal is down-weighted.",
    );
    return { competitorMultiplier: 1, reasoning };
  }

  const ratio = base / peer;
  let mult = 1;
  if (ratio > 1.18) {
    mult = 0.97;
    reasoning.push(
      preferSimilar
        ? `Your rate is materially above similar nearby listings (median ~${(peer / 100).toFixed(0)}); a slight decrease improves competitiveness.`
        : `Your rate is above the city peer median (~${(peer / 100).toFixed(0)}); a slight decrease improves competitiveness.`,
    );
  } else if (ratio < 0.85 && signals.locationDemand01 >= 0.45) {
    mult = 1.03;
    reasoning.push(
      preferSimilar
        ? `Your rate sits below similar peers (median ~${(peer / 100).toFixed(0)}) while demand is not weak; you can capture a modest premium.`
        : `Your rate sits below the city peer median (~${(peer / 100).toFixed(0)}) while demand is not weak; you can capture a modest premium.`,
    );
  } else {
    reasoning.push(
      preferSimilar
        ? `You are near the similar-listing median (~${(peer / 100).toFixed(0)}); no strong comp-based nudge.`
        : `You are near the city peer median (~${(peer / 100).toFixed(0)}); no strong comp-based nudge.`,
    );
  }

  return { competitorMultiplier: mult, reasoning };
}
