/**
 * AI Trust & Reputation System – score users, brokers, listings; store and update dynamically.
 */
import { prisma } from "@/lib/db";
import {
  getHostQualityOrCompute,
  getHostQuality,
  computeAndUpsertHostQuality,
} from "@/lib/bnhub/host-quality";
import { logAiDecision } from "./logger";

export type TrustScoreResult = {
  trustScore: number; // 0-100 (normalized from 0-5 or similar)
  trustLevel: "low" | "medium" | "high";
  source: "host_quality" | "listing_quality" | "broker" | "composite";
  details?: Record<string, unknown>;
};

function ratingToTrustScore(rating: number): number {
  if (rating <= 0) return 0;
  return Math.round((rating / 5) * 100);
}

function trustScoreToLevel(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export async function getTrustScoreForUser(
  userId: string,
  options?: { recompute?: boolean; log?: boolean }
): Promise<TrustScoreResult> {
  if (options?.recompute) {
    await computeAndUpsertHostQuality(userId);
  }
  const hq = await getHostQualityOrCompute(userId);
  const rawScore = hq?.qualityScore ?? 0;
  const trustScore = ratingToTrustScore(rawScore);
  const trustLevel = trustScoreToLevel(trustScore);

  if (options?.log !== false) {
    await logAiDecision({
      action: "trust_score",
      entityType: "user",
      entityId: userId,
      trustLevel,
      trustScore: rawScore,
      details: {
        qualityScore: rawScore,
        isSuperHost: hq?.isSuperHost,
        cancellationRate: hq?.cancellationRate,
        normalizedTrustScore: trustScore,
      },
    });
  }

  return {
    trustScore,
    trustLevel,
    source: "host_quality",
    details: {
      qualityScore: rawScore,
      isSuperHost: hq?.isSuperHost,
      cancellationRate: hq?.cancellationRate,
    },
  };
}

export async function getTrustScoreForListing(
  listingId: string,
  options?: { log?: boolean }
): Promise<TrustScoreResult> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      listingVerificationStatus: true,
      reviews: { select: { propertyRating: true, hostRating: true } },
    },
  });
  if (!listing) throw new Error("Listing not found");

  const ratings = listing.reviews
    .map((r) => r.hostRating ?? r.propertyRating)
    .filter((r): r is number => r != null);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  let composite = ratingToTrustScore(avgRating);
  if (listing.listingVerificationStatus === "VERIFIED") composite = Math.min(100, composite + 10);
  else if (listing.listingVerificationStatus !== "DRAFT") composite = Math.max(0, composite - 15);
  const trustLevel = trustScoreToLevel(composite);

  if (options?.log !== false) {
    await logAiDecision({
      action: "trust_score",
      entityType: "listing",
      entityId: listingId,
      trustLevel,
      trustScore: composite,
      details: {
        avgRating,
        reviewCount: ratings.length,
        verificationStatus: listing.listingVerificationStatus,
      },
    });
  }

  return {
    trustScore: composite,
    trustLevel,
    source: "listing_quality",
    details: { avgRating, reviewCount: ratings.length, verificationStatus: listing.listingVerificationStatus },
  };
}

export async function getTrustScore(params: {
  entityType: "user" | "listing";
  entityId: string;
  recompute?: boolean;
  log?: boolean;
}): Promise<TrustScoreResult> {
  if (params.entityType === "user") {
    return getTrustScoreForUser(params.entityId, { recompute: params.recompute, log: params.log });
  }
  return getTrustScoreForListing(params.entityId, { log: params.log });
}

export async function updateTrustScoreForUser(userId: string): Promise<TrustScoreResult> {
  await computeAndUpsertHostQuality(userId);
  return getTrustScoreForUser(userId, { recompute: false, log: true });
}
