import { NextRequest } from "next/server";
import { approveBooking } from "@/lib/bnhub/booking";
import { getGuestId } from "@/lib/auth/session";

/** POST /api/bnhub/bookings/:id/approve — Host approves a booking request. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hostId = await getGuestId();
    if (!hostId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const { id } = await params;
    const booking = await approveBooking(id, hostId);
    return Response.json(booking);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to approve booking" },
      { status: 400 }
    );
  }
}
