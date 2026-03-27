import { getBookingById, getBookingWithHost, createEscrowPayoutHold, releaseEscrowPayoutHold } from "@/src/modules/bnhub/infrastructure/bnhubRepository";

/**
 * Escrow hold: funds are held at booking confirmation and released after completed stay.
 * This module is explicit and manual-safe (no hidden background auto-release).
 */
export async function holdPaymentInEscrow(bookingId: string) {
  const booking = await getBookingWithHost(bookingId);
  if (!booking) throw new Error("Booking not found");
  return createEscrowPayoutHold(bookingId, booking.listing.ownerId);
}

export async function releasePaymentAfterStay(bookingId: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Booking not found");
  return releaseEscrowPayoutHold(bookingId);
}

