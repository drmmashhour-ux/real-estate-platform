import { NextRequest } from "next/server";
import { cancelBooking, getBookingById } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";

/** POST /api/bnhub/bookings/:id/cancel — Cancel booking (guest or host). Body: { by: "guest" | "host" }. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id } = await params;
    const booking = await getBookingById(id);
    if (!booking) return Response.json({ error: "Not found" }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const by = body?.by === "host" ? "host" : "guest";
    if (by === "host" && booking.listing.ownerId !== userId) {
      return Response.json({ error: "Only the host can cancel as host" }, { status: 403 });
    }
    if (by === "guest" && booking.guestId !== userId) {
      return Response.json({ error: "Only the guest can cancel as guest" }, { status: 403 });
    }
    const updated = await cancelBooking(id, userId, by);
    return Response.json(updated);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to cancel booking" },
      { status: 400 }
    );
  }
}
