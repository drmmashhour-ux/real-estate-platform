import { ListingStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pickPrimaryAngle, suggestChannels } from "../ai/growthAIService";
import type { ListingGrowthInput } from "../ai/growthAIService";

export function determineRecommendedAngle(input: ListingGrowthInput): string {
  return pickPrimaryAngle(input);
}

export function determineRecommendedChannels() {
  return suggestChannels();
}

export const DEFAULT_READINESS_THRESHOLD = 70;

export type ReadinessBreakdown = {
  listingLive: boolean;
  verifiedHost: boolean;
  marketingProfileScore: number | null;
  marketingProfileOk: boolean;
  score: number;
  blockers: string[];
};

export async function getReadinessBreakdown(listingId: string): Promise<ReadinessBreakdown | null> {
  const l = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      listingStatus: true,
      verificationStatus: true,
      title: true,
      description: true,
      photos: true,
      nightPriceCents: true,
    },
  });
  if (!l) return null;

  const listingLive =
    l.listingStatus === ListingStatus.PUBLISHED || l.listingStatus === ListingStatus.APPROVED;
  const verifiedHost = l.verificationStatus === VerificationStatus.VERIFIED;

  const prof = await prisma.bnhubListingMarketingProfile.findUnique({
    where: { listingId },
    select: { readinessScore: true },
  });
  const marketingProfileScore = prof?.readinessScore ?? null;
  const marketingProfileOk = prof == null || (prof.readinessScore ?? 0) >= DEFAULT_READINESS_THRESHOLD;

  const blockers: string[] = [];
  if (!listingLive) blockers.push("listing_not_published_or_approved");
  if (!verifiedHost) blockers.push("host_not_verified");
  if (!marketingProfileOk) blockers.push("marketing_readiness_below_threshold");

  let score = 0;
  if (listingLive) score += 35;
  if (verifiedHost) score += 35;
  if (marketingProfileScore != null) {
    score += Math.round((marketingProfileScore / 100) * 30);
  } else {
    score += 15;
  }
  score = Math.min(100, score);

  return {
    listingLive,
    verifiedHost,
    marketingProfileScore,
    marketingProfileOk,
    score,
    blockers,
  };
}

/** Heuristic 0–100 readiness (deterministic; replace with richer rules as needed). */
export async function computeReadinessScore(listingId: string): Promise<number> {
  const b = await getReadinessBreakdown(listingId);
  return b?.score ?? 0;
}

export function identifyMissingMarketingData(listing: {
  title: string;
  description: string | null;
  photos: unknown;
}): string[] {
  const missing: string[] = [];
  if (!listing.description || listing.description.length < 40) missing.push("short_description");
  const photos = Array.isArray(listing.photos) ? listing.photos : [];
  if (photos.length < 3) missing.push("few_photos");
  if (!listing.title || listing.title.length < 5) missing.push("title");
  return missing;
}

export async function listingEligibleForGrowthAutopilot(listingId: string): Promise<boolean> {
  const b = await getReadinessBreakdown(listingId);
  if (!b) return false;
  return b.listingLive && b.verifiedHost && b.marketingProfileOk;
}
