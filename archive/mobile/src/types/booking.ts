/**
 * Supabase `public.bookings` — guest BNHub lifecycle.
 * Align with `apps/mobile/docs/supabase-listings.sql` and `apps/web/lib/bookings/guest-booking-status.ts`.
 */
export type GuestBookingLifecycleStatus =
  | "pending"
  | "processing"
  | "paid"
  | "canceled"
  | "completed";

/** Loose row status from API (unknown values still allowed at runtime). */
export type BookingStatus = GuestBookingLifecycleStatus | (string & {});

export type GuestSupabaseBooking = {
  id: string;
  listing_id: string;
  dates: unknown;
  total_price: number;
  guest_email: string | null;
  status: BookingStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string | null;
};

export type GuestSupabaseBookingWithListing = GuestSupabaseBooking & {
  listings: { title: string } | { title: string }[] | null;
};
