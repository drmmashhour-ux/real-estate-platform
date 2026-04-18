import type { PlatformTrustTier, Prisma } from "@prisma/client";
import { ListingVerificationStatus, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getFraudTrustPenaltyPoints } from "@/lib/trust/fraud-trust-adjustment";
import { clampTrustScore, platformTrustTierFromScore } from "@/lib/trust/validators";

export type ListingTrustComputeResult = {
  score: number;
  level: PlatformTrustTier;
  reasonsJson: Prisma.InputJsonValue;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function photoCount(photos: unknown): number {
  if (!Array.isArray(photos)) return 0;
  return photos.filter((x): x is string => typeof x === "string" && x.trim().length > 0).length;
}

/** BNHub short-term listing id as `PlatformTrustEntityType.listing`. */
export async function computeListingTrustScore(listingId: string): Promise<ListingTrustComputeResult> {
  const [listing, lv, agg, disputes] = await Promise.all([
    prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        verificationStatus: true,
        listingVerificationStatus: true,
        description: true,
        amenities: true,
        photos: true,
        ownerId: true,
      },
    }),
    prisma.listingVerification.findUnique({ where: { listingId } }),
    prisma.propertyRatingAggregate.findUnique({
      where: { listingId },
      select: { avgRating: true, totalReviews: true },
    }),
    prisma.dispute.count({ where: { listingId } }),
  ]);

  if (!listing) {
    return {
      score: 0,
      level: "low",
      reasonsJson: { error: "listing_not_found", engine: "platform_listing_trust_v1" },
    };
  }

  let raw = 24;
  const reasons: Record<string, Prisma.JsonValue> = {};

  if (listing.verificationStatus === VerificationStatus.VERIFIED) {
    raw += 18;
    reasons.hostListingVerified = true;
  } else if (listing.verificationStatus === VerificationStatus.PENDING) {
    raw += 6;
  }

  if (
    listing.listingVerificationStatus === ListingVerificationStatus.VERIFIED ||
    listing.listingVerificationStatus === ListingVerificationStatus.PENDING_VERIFICATION
  ) {
    raw += listing.listingVerificationStatus === ListingVerificationStatus.VERIFIED ? 8 : 4;
    reasons.listingVerificationStatus = listing.listingVerificationStatus;
  }

  if (lv) {
    let bump = 0;
    if (lv.contactVerified) bump += 6;
    if (lv.addressVerified) bump += 6;
    if (lv.photoVerified) bump += 5;
    if (lv.contentReviewed) bump += 7;
    raw += bump;
    reasons.adminListingVerification = {
      contact: lv.contactVerified,
      address: lv.addressVerified,
      photo: lv.photoVerified,
      content: lv.contentReviewed,
      level: lv.verificationLevel,
    };
  }

  const descLen = (listing.description ?? "").trim().length;
  raw += clamp01(descLen / 500) * 12;
  const pc = photoCount(listing.photos);
  raw += clamp01(pc / 10) * 14;
  const am = Array.isArray(listing.amenities) ? listing.amenities.length : 0;
  raw += clamp01(am / 14) * 8;
  reasons.photoCount = pc;
  reasons.descLen = descLen;

  if (agg && agg.totalReviews > 0 && agg.avgRating != null) {
    raw += clamp01((agg.avgRating - 3) / 2) * 16;
    raw += clamp01(Math.log1p(agg.totalReviews) / Math.log1p(40)) * 8;
    reasons.reviewAvg = agg.avgRating;
    reasons.reviewCount = agg.totalReviews;
  }

  raw -= Math.min(24, disputes * 5);
  reasons.disputeCount = disputes;

  const { penalty, reasons: fraudReasons } = await getFraudTrustPenaltyPoints("listing", listingId);
  raw -= penalty;
  if (fraudReasons.length) reasons.fraud = fraudReasons;

  const score = clampTrustScore(raw);
  const level = platformTrustTierFromScore(score);
  return {
    score,
    level,
    reasonsJson: { reasons, penalty, ownerId: listing.ownerId, engine: "platform_listing_trust_v1" },
  };
}
