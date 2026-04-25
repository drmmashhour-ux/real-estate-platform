import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { applyEnforcement } from "@/lib/trust-safety/enforcement-service";

/**
 * POST /api/admin/trust-safety/actions/hold-payout
 * Body: { incidentId: string, bookingId?: string, hostId?: string, listingId?: string, reasonCode: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const createdBy = await getGuestId();
    if (!createdBy) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const incidentId = body?.incidentId;
    const reasonCode = body?.reasonCode ?? "UNSAFE_PROPERTY";
    if (!incidentId) return Response.json({ error: "incidentId required" }, { status: 400 });

    const { actionId } = await applyEnforcement({
      incidentId,
      actionType: "PAYOUT_HOLD",
      reasonCode,
      notes: body?.notes,
      createdBy,
      bookingId: body?.bookingId,
      hostId: body?.hostId,
      listingId: body?.listingId,
    });
    return Response.json({ actionId, message: "Payout hold applied." });
  } catch (e) {
    return Response.json({ error: "Failed to hold payout" }, { status: 400 });
  }
}
