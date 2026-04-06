import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  confirmBookingManualSettlement,
  resetManualPaymentPending,
  setManualPaymentFailed,
} from "@/lib/bnhub/booking";

type Body = { bookingId?: string; action?: string; note?: string };

/**
 * PATCH /api/bookings/manual-payment — alias for BNHub manual settlement (host-facing).
 * Body: `{ bookingId, action: "received" | "failed" | "reset_pending", note? }`
 */
export async function PATCH(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }
  const id = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  if (!id) return Response.json({ error: "bookingId required" }, { status: 400 });
  const action = typeof body.action === "string" ? body.action.trim() : "";
  const note = typeof body.note === "string" ? body.note.slice(0, 2000) : undefined;
  try {
    if (action === "received") {
      const booking = await confirmBookingManualSettlement(id, userId);
      return Response.json(booking);
    }
    if (action === "failed") {
      const booking = await setManualPaymentFailed(id, userId, note);
      return Response.json(booking);
    }
    if (action === "reset_pending") {
      const booking = await resetManualPaymentPending(id, userId);
      return Response.json(booking);
    }
    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Manual payment update failed" },
      { status: 400 },
    );
  }
}
