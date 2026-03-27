import { NextRequest } from "next/server";
import { declineBooking } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";

/** POST /api/bnhub/bookings/:id/decline — Host declines a booking request. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const hostId = await getGuestId();
    if (!hostId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason : undefined;
    const booking = await declineBooking(id, hostId, reason);
    return Response.json(booking);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to decline booking" },
      { status: 400 }
    );
  }
}
