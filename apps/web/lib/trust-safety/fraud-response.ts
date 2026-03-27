/**
 * Fraud / Scam Listing Response:
 * 1. Freeze listing (under_investigation)
 * 2. Freeze related transactions (block new bookings, hold payouts)
 * 3. Flag the account (restricted)
 * 4. Platform decision: restore listing, remove listing, ban account
 */

import { prisma } from "@/lib/db";
import type { AccountStatusValue } from "./constants";

/** Step 1: Set listing to UNDER_INVESTIGATION (already supported by anti-fraud). */
export async function freezeListing(listingId: string): Promise<void> {
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { listingStatus: "UNDER_INVESTIGATION" },
  });
}

/** Step 2: Hold payouts for all payments linked to this listing's bookings. */
export async function holdPayoutsForListing(
  listingId: string,
  reason: "fraud_investigation" | "safety_complaint" | "dispute_escalation" = "fraud_investigation"
): Promise<number> {
  const bookings = await prisma.booking.findMany({
    where: { listingId },
    select: { id: true },
  });
  const bookingIds = bookings.map((b) => b.id);
  const result = await prisma.payment.updateMany({
    where: { bookingId: { in: bookingIds } },
    data: {
      payoutHoldReason: reason,
      hostPayoutReleasedAt: null,
    },
  });
  return result.count;
}

/** Step 3: Restrict user account (cannot publish, withdraw). */
export async function restrictUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: "RESTRICTED" },
  });
}

/** Step 5: Platform decision - restore listing. */
export async function restoreListing(listingId: string): Promise<void> {
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { listingStatus: "DRAFT" },
  });
  await releasePayoutHoldsForListing(listingId);
}

/** Step 5: Platform decision - remove listing (suspend). */
export async function removeListing(listingId: string): Promise<void> {
  await prisma.shortTermListing.update({
    where: { id: listingId },
    data: { listingStatus: "SUSPENDED" },
  });
}

/** Step 5: Platform decision - ban account. */
export async function banUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: "BANNED" },
  });
}

/** Release payout holds for a listing's payments (e.g. after fraud investigation cleared). */
export async function releasePayoutHoldsForListing(listingId: string): Promise<number> {
  const bookings = await prisma.booking.findMany({
    where: { listingId },
    select: { id: true, checkIn: true },
  });
  let count = 0;
  for (const b of bookings) {
    const pay = await prisma.payment.findUnique({
      where: { bookingId: b.id },
      select: { id: true, payoutHoldReason: true },
    });
    if (pay?.payoutHoldReason === "fraud_investigation") {
      const releaseAt = new Date(b.checkIn);
      releaseAt.setHours(releaseAt.getHours() + 48);
      await prisma.payment.update({
        where: { id: pay.id },
        data: { payoutHoldReason: null, hostPayoutReleasedAt: releaseAt },
      });
      count++;
    }
  }
  return count;
}

/** Set user account status (admin). */
export async function setUserAccountStatus(userId: string, status: AccountStatusValue): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { accountStatus: status },
  });
}
