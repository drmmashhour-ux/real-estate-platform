import { prisma } from "@/lib/db";
import { VerificationStatus } from "@prisma/client";

export type BookingConfidenceLevel = "low" | "medium" | "high";

export type BookingConfidenceResult = {
  level: BookingConfidenceLevel;
  score: number;
  reasons: string[];
};

/**
 * Deterministic confidence for booking UX (trust-first). Pure inputs for testing.
 */
export function computeBookingConfidence(input: {
  listingTrustScore0to100: number;
  listingVerified: boolean;
  reviewAvg0to5: number | null;
  reviewCount: number;
  openFraudSignals: number;
  hostTrustScore0to100: number | null;
}): BookingConfidenceResult {
  const reasons: string[] = [];
  let score = input.listingTrustScore0to100 * 0.45;

  if (input.listingVerified) {
    score += 18;
    reasons.push("Verified listing");
  } else {
    reasons.push("Listing not yet verified");
  }

  if (input.reviewCount > 0 && input.reviewAvg0to5 != null) {
    const r = (input.reviewAvg0to5 / 5) * 22;
    score += r;
    reasons.push(`${input.reviewCount} review(s), avg ${input.reviewAvg0to5.toFixed(1)}/5`);
  } else {
    reasons.push("Few or no reviews yet");
  }

  if (input.hostTrustScore0to100 != null && input.hostTrustScore0to100 > 0) {
    score += input.hostTrustScore0to100 * 0.15;
    reasons.push("Host trust profile");
  }

  const fraudPenalty = Math.min(35, input.openFraudSignals * 12);
  score -= fraudPenalty;
  if (input.openFraudSignals > 0) {
    reasons.push("Open trust-safety signals — our team may review");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const level: BookingConfidenceLevel =
    score >= 72 ? "high" : score >= 48 ? "medium" : "low";

  return { level, score, reasons };
}

export async function generateBookingConfidence(
  listingId: string,
  guestUserId?: string | null
): Promise<BookingConfidenceResult & { guestTrustHint?: string | null }> {
  void guestUserId;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      verificationStatus: true,
      ownerId: true,
      reviews: { select: { propertyRating: true } },
      verificationFraudAlerts: { select: { id: true } },
    },
  });
  if (!listing) throw new Error("Listing not found");

  const [trustModule, hostProfile] = await Promise.all([
    import("@/src/modules/bnhub/application/trustService").then((m) =>
      m.generateListingTrustScore(listingId)
    ),
    prisma.bnhubHostProfile.findUnique({
      where: { userId: listing.ownerId },
      select: { trustScore: true },
    }),
  ]);

  const ratings = listing.reviews.map((r) => r.propertyRating);
  const reviewAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  const base = computeBookingConfidence({
    listingTrustScore0to100: trustModule.score,
    listingVerified: listing.verificationStatus === VerificationStatus.VERIFIED,
    reviewAvg0to5: reviewAvg,
    reviewCount: ratings.length,
    openFraudSignals: listing.verificationFraudAlerts.length,
    hostTrustScore0to100: hostProfile?.trustScore ?? null,
  });

  let guestTrustHint: string | null = null;
  if (guestUserId) {
    const guest = await prisma.bnhubGuestProfile.findUnique({
      where: { userId: guestUserId },
      select: { trustScore: true },
    });
    if (guest && guest.trustScore < 30) {
      guestTrustHint = "Complete your guest profile to improve match quality.";
    }
  }

  return { ...base, guestTrustHint };
}
