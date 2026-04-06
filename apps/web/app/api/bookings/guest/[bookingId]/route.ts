import { fetchGuestSupabaseBookingSnapshot } from "@/lib/bookings/guest-supabase-booking-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/bookings/guest/[bookingId] — full guest-visible BNHub booking snapshot (service role; UUID is the capability).
 */
export async function GET(_req: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await context.params;
  const result = await fetchGuestSupabaseBookingSnapshot(bookingId ?? "");
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ booking: result.booking });
}
