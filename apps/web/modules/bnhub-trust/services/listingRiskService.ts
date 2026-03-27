import {
  BnhubFraudSeverity,
  BnhubTrustGeocodeStatus,
  BnhubTrustIdentitySessionStatus,
  BnhubTrustIdentityUserRole,
  BnhubTrustProfileStatus,
  BnhubTrustPromotionGateStatus,
  BnhubTrustPayoutGateStatus,
  BnhubTrustRiskLevel,
  BnhubTrustRiskFlagTypeV2,
  BnhubTrustRiskFlagVisibility,
  BnhubLuxuryEligibilityStatus,
  BnhubTrustIdentityAuditActor,
  BnhubTrustLocationPolicyStatus,
  BnhubSafetyReviewStatus,
  ListingStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { geocodeListingAddress } from "@/modules/bnhub-trust/services/addressValidationService";
import { upsertMediaValidation } from "@/modules/bnhub-trust/services/mediaTrustService";
import { checkListingLocationPolicy } from "@/modules/bnhub-trust/services/zonePolicyService";
import { createRiskFlag } from "@/modules/bnhub-trust/services/riskFlagService";
import { logRiskAction } from "@/modules/bnhub-trust/services/trustDecisionAuditService";

export async function computePriceSanityScore(listingId: string): Promise<number> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { nightPriceCents: true, city: true },
  });
  if (!listing) return 50;
  const peers = await prisma.shortTermListing.findMany({
    where: {
      city: listing.city,
      listingStatus: { notIn: [ListingStatus.PERMANENTLY_REMOVED, ListingStatus.REJECTED_FOR_FRAUD] },
    },
    select: { nightPriceCents: true },
    take: 30,
  });
  const prices = peers.map((p) => p.nightPriceCents).filter((n) => n > 0).sort((a, b) => a - b);
  if (prices.length < 5) return 70;
  const p25 = prices[Math.floor(prices.length * 0.25)];
  if (listing.nightPriceCents < p25 * 0.15) return 15;
  if (listing.nightPriceCents < p25 * 0.35) return 45;
  return 85;
}

export async function computeDuplicationScore(listingId: string): Promise<number> {
  const m = await prisma.bnhubMediaTrustValidation.findUnique({
    where: { listingId },
    select: { duplicateImageRiskScore: true },
  });
  return Math.max(0, 100 - (m?.duplicateImageRiskScore ?? 0));
}

export async function computeBehaviorScore(hostUserId: string): Promise<number> {
  const q = await prisma.bnhubHostQualityProfile.findUnique({
    where: { hostUserId },
    select: { cancellationRateBps: true, responsivenessScore: true },
  });
  if (!q) return 60;
  const cancelPenalty = Math.min(40, (q.cancellationRateBps ?? 0) / 200);
  return Math.max(20, Math.round((q.responsivenessScore ?? 50) - cancelPenalty));
}

export async function computeSafetyPolicyScore(listingId: string): Promise<number> {
  const pol = await prisma.bnhubLocationPolicyProfile.findUnique({
    where: { listingId },
    select: { policyStatus: true },
  });
  if (!pol) return 70;
  if (pol.policyStatus === BnhubTrustLocationPolicyStatus.APPROVED) return 95;
  if (pol.policyStatus === BnhubTrustLocationPolicyStatus.PENDING) return 65;
  if (pol.policyStatus === BnhubTrustLocationPolicyStatus.MANUAL_REVIEW_REQUIRED) return 55;
  if (
    pol.policyStatus === BnhubTrustLocationPolicyStatus.RESTRICTED ||
    pol.policyStatus === BnhubTrustLocationPolicyStatus.REJECTED
  )
    return 15;
  return 65;
}

function deriveRiskLevel(overallRiskScore: number): BnhubTrustRiskLevel {
  if (overallRiskScore >= 80) return BnhubTrustRiskLevel.CRITICAL;
  if (overallRiskScore >= 55) return BnhubTrustRiskLevel.HIGH;
  if (overallRiskScore >= 35) return BnhubTrustRiskLevel.MEDIUM;
  return BnhubTrustRiskLevel.LOW;
}

function deriveTrustStatus(level: BnhubTrustRiskLevel, policyBlocked: boolean): BnhubTrustProfileStatus {
  if (policyBlocked) return BnhubTrustProfileStatus.BLOCKED;
  if (level === BnhubTrustRiskLevel.CRITICAL) return BnhubTrustProfileStatus.RESTRICTED;
  if (level === BnhubTrustRiskLevel.HIGH) return BnhubTrustProfileStatus.REVIEW_REQUIRED;
  return BnhubTrustProfileStatus.TRUSTED;
}

function derivePayoutGate(
  level: BnhubTrustRiskLevel,
  identityOk: boolean
): BnhubTrustPayoutGateStatus {
  if (!identityOk) return BnhubTrustPayoutGateStatus.HOLD;
  if (level === BnhubTrustRiskLevel.CRITICAL) return BnhubTrustPayoutGateStatus.RELEASE_BLOCKED;
  if (level === BnhubTrustRiskLevel.HIGH) return BnhubTrustPayoutGateStatus.HOLD;
  return BnhubTrustPayoutGateStatus.NONE;
}

function derivePromotionGate(level: BnhubTrustRiskLevel): BnhubTrustPromotionGateStatus {
  if (level === BnhubTrustRiskLevel.CRITICAL) return BnhubTrustPromotionGateStatus.BLOCKED;
  if (level === BnhubTrustRiskLevel.HIGH) return BnhubTrustPromotionGateStatus.REVIEW_REQUIRED;
  return BnhubTrustPromotionGateStatus.ELIGIBLE;
}

/**
 * Idempotent full recompute for a listing — updates engine profile + legacy `bnhub_trust_profiles` + luxury eligibility hook.
 */
export async function recomputeListingTrust(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true, city: true },
  });
  if (!listing) return;

  await geocodeListingAddress(listingId).catch(() => {});
  await upsertMediaValidation(listingId).catch(() => {});
  await checkListingLocationPolicy(listingId).catch(() => {});

  const [addr, media, idv, priceS, dupS, behS, safeS] = await Promise.all([
    prisma.bnhubAddressVerification.findUnique({ where: { listingId } }),
    prisma.bnhubMediaTrustValidation.findUnique({ where: { listingId } }),
    prisma.bnhubTrustIdentityVerification.findFirst({
      where: { userId: listing.ownerId, userRole: BnhubTrustIdentityUserRole.HOST },
      orderBy: { updatedAt: "desc" },
    }),
    computePriceSanityScore(listingId),
    computeDuplicationScore(listingId),
    computeBehaviorScore(listing.ownerId),
    computeSafetyPolicyScore(listingId),
  ]);

  const addressScore =
    !addr || addr.geocodeStatus === BnhubTrustGeocodeStatus.FAILED
      ? 30
      : addr.geocodeStatus === BnhubTrustGeocodeStatus.PARTIAL_MATCH || addr.geocodeStatus === BnhubTrustGeocodeStatus.NEEDS_REVIEW
        ? 55
        : Math.min(100, 50 + Math.round(addr.confidenceScore / 2));

  const mediaScore = Math.round(
    ((media?.coverPhotoScore ?? 0) + (media?.photoCoverageScore ?? 0) + (media?.imageConsistencyScore ?? 0)) / 3
  );
  const identityScore =
    idv?.verificationStatus === BnhubTrustIdentitySessionStatus.VERIFIED
      ? 95
      : idv?.verificationStatus === BnhubTrustIdentitySessionStatus.PENDING ||
          idv?.verificationStatus === BnhubTrustIdentitySessionStatus.REQUIRES_INPUT
        ? 55
        : 40;

  const policy = await prisma.bnhubLocationPolicyProfile.findUnique({ where: { listingId } });
  const policyBlocked =
    policy?.policyStatus === BnhubTrustLocationPolicyStatus.REJECTED ||
    policy?.policyStatus === BnhubTrustLocationPolicyStatus.RESTRICTED;

  const overallRiskScore = Math.min(
    100,
    Math.round(
      100 -
        (addressScore * 0.2 +
          mediaScore * 0.2 +
          identityScore * 0.15 +
          priceS * 0.15 +
          dupS * 0.1 +
          behS * 0.1 +
          safeS * 0.1)
    )
  );

  const level = deriveRiskLevel(overallRiskScore);
  const trustStatus = deriveTrustStatus(level, policyBlocked);
  const identityOk = idv?.verificationStatus === BnhubTrustIdentitySessionStatus.VERIFIED;
  const payoutRestrictionStatus = derivePayoutGate(level, identityOk);
  const promotionEligibilityStatus = derivePromotionGate(level);

  const breakdown = {
    addressScore,
    mediaScore,
    identityScore,
    priceSanityScore: priceS,
    duplicationScore: dupS,
    behaviorScore: behS,
    safetyPolicyScore: safeS,
    overallRiskScore,
  };

  await prisma.bnhubListingTrustRiskProfile.upsert({
    where: { listingId },
    create: {
      listingId,
      hostUserId: listing.ownerId,
      identityScore,
      addressScore,
      mediaScore,
      priceSanityScore: priceS,
      duplicationScore: dupS,
      behaviorScore: behS,
      safetyPolicyScore: safeS,
      overallRiskScore,
      overallRiskLevel: level,
      trustStatus,
      payoutRestrictionStatus,
      promotionEligibilityStatus,
      breakdownJson: breakdown,
    },
    update: {
      identityScore,
      addressScore,
      mediaScore,
      priceSanityScore: priceS,
      duplicationScore: dupS,
      behaviorScore: behS,
      safetyPolicyScore: safeS,
      overallRiskScore,
      overallRiskLevel: level,
      trustStatus,
      payoutRestrictionStatus,
      promotionEligibilityStatus,
      breakdownJson: breakdown,
    },
  });

  const trustScoreDisplay = Math.max(0, 100 - overallRiskScore);
  await prisma.bnhubTrustProfile.upsert({
    where: { listingId },
    create: {
      listingId,
      hostUserId: listing.ownerId,
      trustScore: trustScoreDisplay,
      verificationScore: identityScore,
      documentationScore: addressScore,
      listingConsistencyScore: Math.round((addressScore + mediaScore) / 2),
      photoAuthenticityScore: mediaScore,
      pricingSanityScore: priceS,
      duplicationRiskScore: 100 - dupS,
      behaviorRiskScore: 100 - behS,
      overallRiskLevel: level,
      status: trustStatus,
      recommendationsJson: { engine: "bnhub_trust_v1" },
    },
    update: {
      trustScore: trustScoreDisplay,
      verificationScore: identityScore,
      documentationScore: addressScore,
      listingConsistencyScore: Math.round((addressScore + mediaScore) / 2),
      photoAuthenticityScore: mediaScore,
      pricingSanityScore: priceS,
      duplicationRiskScore: 100 - dupS,
      behaviorRiskScore: 100 - behS,
      overallRiskLevel: level,
      status: trustStatus,
    },
  });

  await prisma.bnhubLuxuryTier
    .update({
      where: { listingId },
      data: {
        eligibilityStatus:
          promotionEligibilityStatus === BnhubTrustPromotionGateStatus.BLOCKED
            ? BnhubLuxuryEligibilityStatus.SUSPENDED
            : promotionEligibilityStatus === BnhubTrustPromotionGateStatus.REVIEW_REQUIRED
              ? BnhubLuxuryEligibilityStatus.REVIEW_REQUIRED
              : undefined,
      },
    })
    .catch(() => {});

  const existingSafety = await prisma.bnhubListingSafetyProfile.findUnique({
    where: { listingId },
    select: { reviewStatus: true },
  });
  if (existingSafety?.reviewStatus !== BnhubSafetyReviewStatus.REJECTED) {
    const policyRejected = policy?.policyStatus === BnhubTrustLocationPolicyStatus.REJECTED;
    const hardBookingBlock =
      policyRejected ||
      trustStatus === BnhubTrustProfileStatus.BLOCKED ||
      level === BnhubTrustRiskLevel.CRITICAL ||
      trustStatus === BnhubTrustProfileStatus.RESTRICTED;
    let bookingAllowed = true;
    let listingVisible = true;
    let publicMessageKey = "approved";
    let reviewStatus: BnhubSafetyReviewStatus = BnhubSafetyReviewStatus.APPROVED;
    if (hardBookingBlock) {
      bookingAllowed = false;
      listingVisible = policyRejected || trustStatus === BnhubTrustProfileStatus.BLOCKED ? false : listingVisible;
      publicMessageKey =
        policyRejected || trustStatus === BnhubTrustProfileStatus.BLOCKED
          ? "listing_unavailable"
          : "additional_verification_required";
      reviewStatus = BnhubSafetyReviewStatus.RESTRICTED;
    } else if (trustStatus === BnhubTrustProfileStatus.REVIEW_REQUIRED) {
      publicMessageKey = "safety_review_in_progress";
      reviewStatus = BnhubSafetyReviewStatus.MANUAL_REVIEW_REQUIRED;
    }
    await prisma.bnhubListingSafetyProfile.upsert({
      where: { listingId },
      create: {
        listingId,
        bookingAllowed,
        listingVisible,
        publicMessageKey,
        reviewStatus,
      },
      update: { bookingAllowed, listingVisible, publicMessageKey, reviewStatus },
    });
  }

  if (addr?.geocodeStatus === BnhubTrustGeocodeStatus.PARTIAL_MATCH && (addr.mismatchFlagsJson as { flags?: string[] })?.flags?.length) {
    await createRiskFlag({
      listingId,
      flagType: BnhubTrustRiskFlagTypeV2.ADDRESS_MISMATCH,
      severity: BnhubFraudSeverity.MEDIUM,
      summary: "Address fields could not be fully matched to the geocoded location — review recommended.",
      dedupeListing: true,
    });
  }
  if (media && !media.exteriorPhotoPresent && priceS < 40) {
    await createRiskFlag({
      listingId,
      flagType: BnhubTrustRiskFlagTypeV2.MISSING_EXTERIOR_PHOTO,
      severity: BnhubFraudSeverity.MEDIUM,
      summary: "Limited exterior imagery and atypical pricing — additional validation may be required.",
      dedupeListing: true,
    });
  }
  if (!identityOk && level !== BnhubTrustRiskLevel.LOW) {
    await createRiskFlag({
      listingId,
      userId: listing.ownerId,
      flagType: BnhubTrustRiskFlagTypeV2.IDENTITY_INCOMPLETE,
      severity: BnhubFraudSeverity.LOW,
      summary: "Host identity verification is not complete — some features may stay limited until finished.",
      visibilityScope: BnhubTrustRiskFlagVisibility.SAFE_HOST_VISIBLE,
      dedupeListing: true,
    });
  }

  await logRiskAction({
    actorType: BnhubTrustIdentityAuditActor.SYSTEM,
    listingId,
    actionType: "listing_risk_recomputed",
    actionSummary: `Risk ${level}, trust ${trustStatus}`,
    after: breakdown,
  });
}

export async function upsertListingRiskProfile(listingId: string) {
  await recomputeListingTrust(listingId);
  return prisma.bnhubListingTrustRiskProfile.findUnique({ where: { listingId } });
}
