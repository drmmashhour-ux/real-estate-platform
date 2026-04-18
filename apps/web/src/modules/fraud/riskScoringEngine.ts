import { prisma } from "@/lib/db";
import { ListingStatus } from "@prisma/client";
import {
  computeListingFraudSignals,
  type ListingFraudContext,
  type ListingFraudInput,
} from "@/src/modules/fraud/listingFraudSignals";
import {
  computeReviewFraudSignals,
  type ReviewFraudContext,
  type ReviewFraudInput,
} from "@/src/modules/fraud/reviewFraudSignals";
import { FRAUD_RISK_THRESHOLDS } from "@/src/modules/fraud/fraud.rules";
import {
  FRAUD_SCORE_VERSION,
  type ExplainableFraudSignal,
  type FraudEntityType,
  type FraudRiskLevel,
  type FraudScoreComputation,
} from "@/src/modules/fraud/types";

const LISTING_WEIGHTS: Record<string, number> = {
  duplicate_listing: 0.22,
  suspicious_price: 0.18,
  inconsistent_location: 0.14,
  media_inconsistency: 0.12,
  host_behavior_risk: 0.18,
  listing_completeness_risk: 0.16,
};

const REVIEW_WEIGHTS: Record<string, number> = {
  review_burst: 0.18,
  self_review_risk: 0.28,
  review_pattern_risk: 0.16,
  duplicate_review_text: 0.2,
  booking_review_consistency: 0.18,
};

export function classifyRiskLevel(score: number): FraudRiskLevel {
  if (score >= FRAUD_RISK_THRESHOLDS.critical) return "critical";
  if (score >= FRAUD_RISK_THRESHOLDS.high) return "high";
  if (score >= FRAUD_RISK_THRESHOLDS.medium) return "medium";
  return "low";
}

export function buildFraudEvidence(signals: ExplainableFraudSignal[]): Record<string, unknown> {
  return {
    signals: signals.map((s) => ({
      code: s.code,
      strength: s.normalizedStrength,
      explanation: s.humanExplanation,
      details: s.details,
    })),
    generatedAt: new Date().toISOString(),
  };
}

function weightedScore(signals: ExplainableFraudSignal[], weights: Record<string, number>): number {
  let num = 0;
  let den = 0;
  for (const s of signals) {
    const w = weights[s.code] ?? 0.1;
    num += s.normalizedStrength * w;
    den += w;
  }
  if (den <= 0) return 0;
  return Math.min(1, num / den);
}

async function loadListingContext(listing: ListingFraudInput): Promise<ListingFraudContext> {
  const city = listing.city.trim();
  const peers = await prisma.shortTermListing.findMany({
    where: {
      city: listing.city,
      listingStatus: ListingStatus.PUBLISHED,
      id: { not: listing.id },
    },
    take: 40,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      address: true,
      nightPriceCents: true,
      photos: true,
    },
  });

  const prices = await prisma.shortTermListing.findMany({
    where: {
      city: listing.city,
      listingStatus: ListingStatus.PUBLISHED,
      nightPriceCents: { gt: 0 },
    },
    take: 120,
    select: { nightPriceCents: true },
  });
  const arr = prices.map((p) => p.nightPriceCents).sort((a, b) => a - b);
  const med =
    arr.length === 0
      ? null
      : arr.length % 2
        ? arr[(arr.length - 1) / 2]!
        : (arr[arr.length / 2 - 1]! + arr[arr.length / 2]!) / 2;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const hostRecentListingCount = await prisma.shortTermListing.count({
    where: { ownerId: listing.ownerId, createdAt: { gte: since } },
  });

  let perf: { cancellationRate: number; disputeRate: number } | null = null;
  try {
    perf = await prisma.hostPerformance.findUnique({
      where: { hostId: listing.ownerId },
      select: { cancellationRate: true, disputeRate: true },
    });
  } catch {
    perf = null;
  }

  const jsonPhotos = Array.isArray(listing.photos)
    ? listing.photos.filter((x): x is string => typeof x === "string")
    : [];
  const dbPhotos = await prisma.bnhubListingPhoto.findMany({
    where: { listingId: listing.id },
    select: { url: true },
    take: 40,
  });
  const photoUrls = [...new Set([...jsonPhotos, ...dbPhotos.map((p) => p.url)])];

  const addrLower = listing.address.toLowerCase();
  const cityAppearsInAddress = city.length > 1 && addrLower.includes(city.toLowerCase());

  return {
    medianNightPriceCentsSameCity: med,
    peerListings: peers,
    hostRecentListingCount,
    hostCancellationRate: perf?.cancellationRate ?? null,
    hostDisputeRate: perf?.disputeRate ?? null,
    photoUrls,
    cityAppearsInAddress,
  };
}

async function loadReviewRow(id: string) {
  return prisma.review.findUnique({
    where: { id },
    include: {
      listing: { select: { ownerId: true } },
      booking: { select: { status: true, checkOut: true } },
    },
  });
}

async function loadReviewContextFixed(review: {
  id: string;
  guestId: string;
  listingId: string;
  propertyRating: number;
  comment: string | null;
  createdAt: Date;
  moderationHeld: boolean;
  spamScore: number | null;
}): Promise<ReviewFraudContext> {
  const full = await loadReviewRow(review.id);
  const ownerId = full?.listing.ownerId ?? "";
  const booking = full?.booking;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const reviewsLast24hOnProperty = await prisma.review.count({
    where: { listingId: review.listingId, createdAt: { gte: dayAgo } },
  });

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const guestReviewCount30d = await prisma.review.count({
    where: { guestId: review.guestId, createdAt: { gte: since30 } },
  });

  const dup =
    review.comment && review.comment.trim().length > 10
      ? await prisma.review.findFirst({
          where: {
            comment: review.comment.trim(),
            id: { not: review.id },
          },
          select: { id: true },
        })
      : null;

  const recent = await prisma.review.findMany({
    where: { guestId: review.guestId, createdAt: { gte: since30 } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { propertyRating: true },
  });
  let sameRatingCount = 0;
  for (const r of recent) {
    if (r.propertyRating === review.propertyRating) sameRatingCount++;
    else break;
  }

  return {
    listingOwnerId: ownerId,
    bookingStatus: booking?.status ?? "UNKNOWN",
    bookingCheckOut: booking?.checkOut ?? null,
    reviewsLast24hOnProperty,
    guestReviewCount30d,
    duplicateCommentElsewhere: !!dup,
    guestRatingStreak: { sameRatingCount, rating: review.propertyRating },
  };
}

export async function computeFraudRiskScore(
  entityType: FraudEntityType,
  entityId: string
): Promise<FraudScoreComputation | null> {
  if (entityType === "listing") {
    const row = await prisma.shortTermListing.findUnique({ where: { id: entityId } });
    if (!row) return null;
    const listing: ListingFraudInput = {
      id: row.id,
      ownerId: row.ownerId,
      title: row.title,
      description: row.description,
      address: row.address,
      city: row.city,
      region: row.region,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      nightPriceCents: row.nightPriceCents,
      maxGuests: row.maxGuests,
      beds: row.beds,
      baths: row.baths,
      listingStatus: row.listingStatus,
      verificationStatus: row.verificationStatus,
      listingVerificationStatus: row.listingVerificationStatus,
      houseRules: row.houseRules,
      checkInInstructions: row.checkInInstructions,
      photos: row.photos,
      createdAt: row.createdAt,
    };
    const ctx = await loadListingContext(listing);
    const signals = computeListingFraudSignals(listing, ctx);
    const riskScore = weightedScore(signals, LISTING_WEIGHTS);
    return {
      entityType: "listing",
      entityId,
      riskScore,
      riskLevel: classifyRiskLevel(riskScore),
      signals,
      evidenceJson: buildFraudEvidence(signals),
    };
  }

  if (entityType === "review") {
    const row = await prisma.review.findUnique({ where: { id: entityId } });
    if (!row) return null;
    const review: ReviewFraudInput = {
      id: row.id,
      guestId: row.guestId,
      listingId: row.listingId,
      propertyRating: row.propertyRating,
      comment: row.comment,
      createdAt: row.createdAt,
      moderationHeld: row.moderationHeld,
      spamScore: row.spamScore,
    };
    const ctx = await loadReviewContextFixed(review);
    const signals = computeReviewFraudSignals(review, ctx);
    const riskScore = weightedScore(signals, REVIEW_WEIGHTS);
    return {
      entityType: "review",
      entityId,
      riskScore,
      riskLevel: classifyRiskLevel(riskScore),
      signals,
      evidenceJson: buildFraudEvidence(signals),
    };
  }

  if (entityType === "host") {
    const perf = await prisma.hostPerformance.findUnique({ where: { hostId: entityId } });
    if (!perf) return null;
    const signals: ExplainableFraudSignal[] = [
      {
        code: "host_behavior_risk",
        normalizedStrength: Math.min(
          1,
          perf.cancellationRate * 1.2 + perf.disputeRate * 2.5 + (perf.score < 40 ? 0.35 : 0)
        ),
        humanExplanation: "Aggregated host operational metrics (cancellations, disputes, composite score).",
        details: {
          cancellationRate: perf.cancellationRate,
          disputeRate: perf.disputeRate,
          score: perf.score,
        },
      },
    ];
    const riskScore = signals[0]!.normalizedStrength;
    return {
      entityType: "host",
      entityId,
      riskScore,
      riskLevel: classifyRiskLevel(riskScore),
      signals,
      evidenceJson: buildFraudEvidence(signals),
    };
  }

  if (entityType === "booking") {
    const b = await prisma.booking.findUnique({
      where: { id: entityId },
      select: { status: true, guestId: true, listing: { select: { ownerId: true } } },
    });
    if (!b) return null;
    const disputeCount = await prisma.dispute.count({ where: { bookingId: entityId } });
    let strength = disputeCount > 0 ? 0.45 : 0;
    if (b.status.startsWith("CANCEL")) strength = Math.max(strength, 0.15);
    const signals: ExplainableFraudSignal[] = [
      {
        code: "booking_pattern_risk",
        normalizedStrength: Math.min(1, strength),
        humanExplanation:
          strength > 0.2
            ? "Booking has dispute records or cancellation-type status worth correlating with other signals."
            : "No strong single-booking fraud pattern.",
        details: { status: b.status, disputeCount },
      },
    ];
    const riskScore = signals[0]!.normalizedStrength;
    return {
      entityType: "booking",
      entityId,
      riskScore,
      riskLevel: classifyRiskLevel(riskScore),
      signals,
      evidenceJson: buildFraudEvidence(signals),
    };
  }

  if (entityType === "user") {
    const u = await prisma.user.findUnique({
      where: { id: entityId },
      select: { id: true, emailVerifiedAt: true },
    });
    if (!u) return null;
    const idv = await prisma.identityVerification.findUnique({
      where: { userId: entityId },
      select: { verificationStatus: true },
    });
    let strength = 0;
    if (!u.emailVerifiedAt) strength += 0.4;
    if (!idv || idv.verificationStatus !== "VERIFIED") strength += 0.35;
    const signals: ExplainableFraudSignal[] = [
      {
        code: "account_verification_gap",
        normalizedStrength: Math.min(1, strength),
        humanExplanation:
          strength > 0.3
            ? "Account lacks verified email or identity verification."
            : "Account verification state looks acceptable at a coarse check.",
        details: {
          emailVerified: !!u.emailVerifiedAt,
          identityStatus: idv?.verificationStatus ?? null,
        },
      },
    ];
    const riskScore = signals[0]!.normalizedStrength;
    return {
      entityType: "user",
      entityId,
      riskScore,
      riskLevel: classifyRiskLevel(riskScore),
      signals,
      evidenceJson: buildFraudEvidence(signals),
    };
  }

  return null;
}

export async function saveFraudRiskScore(result: FraudScoreComputation): Promise<void> {
  await prisma.fraudRiskScore.upsert({
    where: {
      entityType_entityId: { entityType: result.entityType, entityId: result.entityId },
    },
    create: {
      entityType: result.entityType,
      entityId: result.entityId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      scoreVersion: FRAUD_SCORE_VERSION,
      evidenceJson: result.evidenceJson as object,
    },
    update: {
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      scoreVersion: FRAUD_SCORE_VERSION,
      evidenceJson: result.evidenceJson as object,
    },
  });
}
