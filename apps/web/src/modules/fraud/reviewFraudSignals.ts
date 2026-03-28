import type { ExplainableFraudSignal } from "@/src/modules/fraud/types";

export type ReviewFraudInput = {
  id: string;
  guestId: string;
  listingId: string;
  propertyRating: number;
  comment: string | null;
  createdAt: Date;
  moderationHeld: boolean;
  spamScore: number | null;
};

export type ReviewFraudContext = {
  listingOwnerId: string;
  bookingStatus: string;
  bookingCheckOut: Date | null;
  reviewsLast24hOnProperty: number;
  guestReviewCount30d: number;
  duplicateCommentElsewhere: boolean;
  guestRatingStreak: { sameRatingCount: number; rating: number };
};

export function detectReviewBurstRisk(propertyId: string, count24h: number): ExplainableFraudSignal {
  const strength = count24h >= 8 ? 0.85 : count24h >= 5 ? 0.55 : count24h >= 4 ? 0.35 : 0;
  return {
    code: "review_burst",
    normalizedStrength: strength,
    humanExplanation:
      strength > 0.3
        ? "Unusually many reviews were published for this listing within a short window."
        : "Review arrival rate for this listing is within normal bounds.",
    details: { propertyId, reviewsLast24hOnProperty: count24h },
  };
}

export function detectSelfReviewRisk(review: ReviewFraudInput, ctx: ReviewFraudContext): ExplainableFraudSignal {
  const self = review.guestId === ctx.listingOwnerId;
  return {
    code: "self_review_risk",
    normalizedStrength: self ? 1 : 0,
    humanExplanation: self
      ? "Reviewer account matches listing host account (should be blocked upstream; flag for audit)."
      : "Reviewer is not the listing owner.",
    details: { guestId: review.guestId, listingOwnerId: ctx.listingOwnerId },
  };
}

export function detectReviewPatternRisk(review: ReviewFraudInput, ctx: ReviewFraudContext): ExplainableFraudSignal {
  let strength = 0;
  if (ctx.guestReviewCount30d >= 12) strength += 0.4;
  else if (ctx.guestReviewCount30d >= 8) strength += 0.22;
  if (ctx.guestRatingStreak.sameRatingCount >= 5) strength += 0.35;
  else if (ctx.guestRatingStreak.sameRatingCount >= 3) strength += 0.18;

  return {
    code: "review_pattern_risk",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.25
        ? "Guest has many recent reviews or repeated identical star ratings across stays."
        : "No strong volume or rating-pattern anomaly detected.",
    details: {
      guestReviewCount30d: ctx.guestReviewCount30d,
      ratingStreak: ctx.guestRatingStreak,
    },
  };
}

export function detectTextSimilarityRisk(
  review: ReviewFraudInput,
  duplicateElsewhere: boolean
): ExplainableFraudSignal {
  const strength = duplicateElsewhere ? 0.75 : 0;
  return {
    code: "duplicate_review_text",
    normalizedStrength: strength,
    humanExplanation: duplicateElsewhere
      ? "Same comment text appears on another review record (possible duplicate or recycled template)."
      : "Comment text is not flagged as duplicated elsewhere in the sample window.",
    details: { hasComment: !!(review.comment && review.comment.trim()) },
  };
}

export function detectBookingReviewConsistencyRisk(
  review: ReviewFraudInput,
  ctx: ReviewFraudContext
): ExplainableFraudSignal {
  let strength = 0;
  if (ctx.bookingStatus !== "COMPLETED") strength = 0.95;
  if (ctx.bookingCheckOut && review.createdAt.getTime() < ctx.bookingCheckOut.getTime() - 60 * 60 * 1000) {
    strength = Math.max(strength, 0.4);
  }
  if (review.moderationHeld || (review.spamScore != null && review.spamScore >= 0.75)) {
    strength = Math.max(strength, 0.35);
  }

  return {
    code: "booking_review_consistency",
    normalizedStrength: Math.min(1, strength),
    humanExplanation:
      strength > 0.3
        ? "Review timing or booking state looks inconsistent with a completed stay, or spam heuristics fired."
        : "Review aligns with completed-stay expectations.",
    details: {
      bookingStatus: ctx.bookingStatus,
      bookingCheckOut: ctx.bookingCheckOut?.toISOString() ?? null,
      moderationHeld: review.moderationHeld,
      spamScore: review.spamScore,
    },
  };
}

export function computeReviewFraudSignals(
  review: ReviewFraudInput,
  ctx: ReviewFraudContext
): ExplainableFraudSignal[] {
  return [
    detectReviewBurstRisk(review.listingId, ctx.reviewsLast24hOnProperty),
    detectSelfReviewRisk(review, ctx),
    detectReviewPatternRisk(review, ctx),
    detectTextSimilarityRisk(review, ctx.duplicateCommentElsewhere),
    detectBookingReviewConsistencyRisk(review, ctx),
  ];
}
