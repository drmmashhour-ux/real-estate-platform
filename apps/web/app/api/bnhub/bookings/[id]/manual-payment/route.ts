import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  confirmBookingManualSettlement,
  resetManualPaymentPending,
  setManualPaymentFailed,
} from "@/lib/bnhub/booking";

type Body = { action?: string; note?: string };

/** POST /api/bnhub/bookings/:id/manual-payment — host/admin manual settlement (offline markets). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params;
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }
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
