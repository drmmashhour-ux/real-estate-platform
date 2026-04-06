import { prisma } from "@/lib/db";

export class GuestIdentityRequiredError extends Error {
  readonly code = "IDENTITY_VERIFICATION_REQUIRED" as const;

  constructor(message: string) {
    super(message);
    this.name = "GuestIdentityRequiredError";
  }
}

/** Minimum booking total (USD) before ID verification is required. 0 = disabled. */
export function parseIdentityMinTotalUsd(): number {
  const raw = process.env.BNHUB_BOOKING_IDENTITY_VERIFICATION_MIN_TOTAL_USD?.trim();
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Enforces optional ID verification: high booking value and/or host opt-in.
 * Anonymous guests fail when a rule applies (they must sign in and verify).
 */
export async function assertGuestIdentityAllowedForBooking(params: {
  prismaListingId: string;
  /** Guest total in USD (two decimals; match Supabase RPC rounding when from guest path). */
  guestTotalUsd: number;
  /** Prisma `User.id` when the guest has a linked account; null if anonymous. */
  prismaGuestUserId: string | null;
}): Promise<void> {
  const minUsd = parseIdentityMinTotalUsd();
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: params.prismaListingId },
    select: { requireGuestIdentityVerification: true },
  });
  const needHost = listing?.requireGuestIdentityVerification === true;
  const total = params.guestTotalUsd;
  const needValue = minUsd > 0 && total + 1e-6 >= minUsd;
  if (!needHost && !needValue) return;

  if (!params.prismaGuestUserId) {
    throw new GuestIdentityRequiredError(
      needHost
        ? "This host requires a verified account. Sign in and complete identity verification to book."
        : "For higher-value stays, sign in and verify your government ID to continue."
    );
  }

  const idv = await prisma.identityVerification.findUnique({
    where: { userId: params.prismaGuestUserId },
    select: { verificationStatus: true },
  });
  if (idv?.verificationStatus === "VERIFIED") return;

  throw new GuestIdentityRequiredError(
    needHost
      ? "This host requires a verified ID. Complete identity verification in your profile."
      : "Verify your government ID in your profile before booking this stay."
  );
}
