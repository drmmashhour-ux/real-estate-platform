/**
 * BNHUB / LECIPM notification entry points (email first; push/SMS later).
 *
 * Implemented:
 * - `booking-emails` — guest + ops copy when a Supabase guest booking is marked paid (Stripe webhook).
 *
 * TODO (future phases, no new provider required until product needs it):
 * - `notifyPaymentReceived` — explicit payment-received template if distinct from confirmation
 * - `notifyUpcomingStayReminder` — scheduled reminder before check-in
 * - `notifyHostNewBooking` — host-facing new booking / payout hooks
 */
export * from "./booking-emails";
