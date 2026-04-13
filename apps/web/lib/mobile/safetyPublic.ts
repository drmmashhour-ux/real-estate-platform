import type { BnhubListingSafetyProfile, BnhubSafetyReviewStatus } from "@prisma/client";

/** Guest-safe copy — never implies neighborhood crime or unverified danger claims. */
export function publicMessageFromSafetyKey(key: string | null | undefined): string {
  switch (key) {
    case "approved":
      return "This listing is available on BNHUB.";
    case "safety_review_in_progress":
      return "Safety review in progress — some actions may be limited until verification completes.";
    case "listing_unavailable":
      return "This listing is currently unavailable.";
    case "additional_verification_required":
      return "Additional verification is required before this listing can be booked.";
    default:
      return "Listing status is being confirmed — please check back shortly.";
  }
}

export type EffectiveSafety = {
  reviewStatus: BnhubSafetyReviewStatus;
  publicMessageKey: string;
  bookingAllowed: boolean;
  listingVisible: boolean;
  guestMessage: string;
};

export function effectiveListingSafety(row: BnhubListingSafetyProfile | null): EffectiveSafety {
  if (!row) {
    return {
      reviewStatus: "APPROVED" as BnhubSafetyReviewStatus,
      publicMessageKey: "approved",
      bookingAllowed: true,
      listingVisible: true,
      guestMessage: publicMessageFromSafetyKey("approved"),
    };
  }
  return {
    reviewStatus: row.reviewStatus,
    publicMessageKey: row.publicMessageKey,
    bookingAllowed: row.bookingAllowed,
    listingVisible: row.listingVisible,
    guestMessage: publicMessageFromSafetyKey(row.publicMessageKey),
  };
}
