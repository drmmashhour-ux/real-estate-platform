import { fetchGuestSupabaseBookingStatusOnly } from "@/lib/bookings/guest-supabase-booking-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/guest/[bookingId]/status — BNHUB Supabase guest booking status (platform-owned; replaces direct mobile anon reads).
 */
export async function GET(_req: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params;
  const result = await fetchGuestSupabaseBookingStatusOnly(bookingId ?? "");
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ status: result.status });
}
