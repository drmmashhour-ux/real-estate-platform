import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[finance]";
const PLATFORM_FEE_PERCENT = 10; // 10%

/**
 * Payout Service: Manages host earnings and transfers.
 */
export async function computeHostEarnings(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { totalCents: true, hostFeeCents: true }
  });

  if (!booking) throw new Error("Booking not found");

  const total = booking.totalCents;
  const platformFee = Math.floor((total * PLATFORM_FEE_PERCENT) / 100);
  const netEarnings = total - platformFee;

  return { total, platformFee, netEarnings };
}

/**
 * Record a charge in the ledger.
 */
export async function recordCharge(args: {
  bookingId: string;
  userId: string;
  amount: number;
  stripeId: string;
}) {
  // @ts-ignore
  const entry = await prisma.ledgerEntry.create({
    data: {
      type: "CHARGE",
      bookingId: args.bookingId,
      userId: args.userId,
      amount: args.amount,
      stripeId: args.stripeId,
      status: "SUCCEEDED",
    },
  });

  logInfo(`${TAG} transaction`, { type: "CHARGE", bookingId: args.bookingId, amount: args.amount });

  // Also record the fee
  const { platformFee } = await computeHostEarnings(args.bookingId);
  // @ts-ignore
  await prisma.ledgerEntry.create({
    data: {
      type: "FEE",
      bookingId: args.bookingId,
      amount: platformFee,
      status: "SUCCEEDED",
    },
  });

  return entry;
}

/**
 * Trigger a payout for a host.
 */
export async function triggerHostPayout(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { hostId: true } } }
  });

  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
    throw new Error("Only confirmed or completed bookings can be paid out");
  }

  const { netEarnings } = await computeHostEarnings(bookingId);

  // Check if already paid out
  // @ts-ignore
  const existing = await prisma.ledgerEntry.findFirst({
    where: { bookingId, type: "PAYOUT", status: "SUCCEEDED" }
  });
  if (existing) return existing;

  // In production, this would call Stripe Connect Transfer
  // @ts-ignore
  const payout = await prisma.ledgerEntry.create({
    data: {
      type: "PAYOUT",
      bookingId,
      userId: booking.listing.hostId,
      amount: netEarnings,
      status: "SUCCEEDED", // Simplified
    },
  });

  logInfo(`${TAG} payout`, { bookingId, hostId: booking.listing.hostId, amount: netEarnings });

  return payout;
}

/**
 * Handle refund logic.
 */
export async function processRefund(bookingId: string, amountCents: number) {
  // @ts-ignore
  const refund = await prisma.ledgerEntry.create({
    data: {
      type: "REFUND",
      bookingId,
      amount: amountCents,
      status: "SUCCEEDED",
    },
  });

  logInfo(`${TAG} transaction`, { type: "REFUND", bookingId, amount: amountCents });

  return refund;
}
