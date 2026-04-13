/**
 * Server-side shape for Supabase `public.bookings` (guest mobile BNHUB).
 * Prisma `Booking` is separate; this is for service-role Supabase access only.
 */
export type GuestSupabaseBookingRow = {
  id: string;
  listing_id: string;
  dates: unknown;
  total_price: number | string;
  guest_email?: string | null;
  status: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  created_at?: string;
  updated_at?: string | null;
};
