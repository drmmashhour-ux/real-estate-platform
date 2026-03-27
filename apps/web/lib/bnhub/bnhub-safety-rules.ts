import type { ShortTermListing, PropertyFraudScore } from "@prisma/client";

/** When `true`, unverified listings cannot be booked and high fraud scores hard-block checkout. */
export function isBnhubTrustStrict(): boolean {
  return process.env.BNHUB_TRUST_STRICT === "1";
}

/** Minimum security deposit (cents) when fraud score is elevated. */
export const BNHUB_RISKY_DEPOSIT_MIN_CENTS = Number(process.env.BNHUB_RISKY_DEPOSIT_MIN_CENTS ?? "5000");

export type ListingSafetyEvaluation = {
  ok: boolean;
  blockReason?: string;
  flags: string[];
  requiresDeposit: boolean;
};

/**
 * Pre-booking gate (create booking). Does not block by default unless `BNHUB_TRUST_STRICT=1`.
 */
export function evaluateListingForNewBooking(
  listing: Pick<
    ShortTermListing,
    "id" | "verificationStatus" | "listingStatus" | "securityDepositCents" | "nightPriceCents"
  >,
  fraudRow: Pick<PropertyFraudScore, "fraudScore" | "riskLevel"> | null
): ListingSafetyEvaluation {
  const flags: string[] = [];
  let requiresDeposit = false;

  if (listing.verificationStatus !== "VERIFIED") {
    flags.push("unverified");
    if (isBnhubTrustStrict()) {
      return { ok: false, blockReason: "This listing must be verified before it can be booked.", flags, requiresDeposit };
    }
  }

  const fraudScore = fraudRow?.fraudScore ?? 0;
  if (fraudScore >= 85) {
    flags.push("fraud_critical");
    if (isBnhubTrustStrict()) {
      return {
        ok: false,
        blockReason: "This listing is under elevated fraud review and cannot be booked right now.",
        flags,
        requiresDeposit: true,
      };
    }
  } else if (fraudScore >= 55) {
    flags.push("fraud_elevated");
    requiresDeposit = true;
  }

  if (requiresDeposit && listing.securityDepositCents < BNHUB_RISKY_DEPOSIT_MIN_CENTS) {
    flags.push("deposit_required_for_risk");
    if (isBnhubTrustStrict()) {
      return {
        ok: false,
        blockReason: `For trust & safety, this listing needs a security deposit of at least $${(BNHUB_RISKY_DEPOSIT_MIN_CENTS / 100).toFixed(0)} before bookings.`,
        flags,
        requiresDeposit: true,
      };
    }
  }

  return { ok: true, flags, requiresDeposit };
}

/**
 * Guest checkout (payment) gate — stricter deposit rule always on for risky scores (not only strict mode).
 */
export function evaluateGuestCheckout(
  listing: Pick<ShortTermListing, "securityDepositCents" | "verificationStatus">,
  fraudRow: Pick<PropertyFraudScore, "fraudScore"> | null
): { ok: true } | { ok: false; error: string } {
  if (isBnhubTrustStrict() && listing.verificationStatus !== "VERIFIED") {
    return { ok: false, error: "Checkout requires a verified listing." };
  }
  const fraudScore = fraudRow?.fraudScore ?? 0;
  if (fraudScore >= 55 && listing.securityDepositCents < BNHUB_RISKY_DEPOSIT_MIN_CENTS) {
    return {
      ok: false,
      error: "This stay requires a published security deposit before payment for trust protection. Contact the host or support.",
    };
  }
  return { ok: true };
}
