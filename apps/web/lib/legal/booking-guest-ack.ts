/** When true, POST /api/bnhub/bookings requires guest acknowledgment signature (see `assertGuestShortTermBookingAllowed`). */
export function bookingGuestAckEnforced(): boolean {
  return process.env.BOOKING_GUEST_ACK_ENFORCED === "true";
}
