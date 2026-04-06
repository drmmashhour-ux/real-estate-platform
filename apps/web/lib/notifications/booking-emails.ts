/**
 * Guest booking emails (paid confirmation). Implementation: Resend via `lib/email/resend`.
 * Import from here so other notification channels can wrap the same entry points later.
 */
export {
  sendBookingConfirmationEmail,
  type BookingConfirmationEmailParams,
} from "@/lib/email/send-booking-confirmation";
