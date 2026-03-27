import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { applyEnforcement } from "@/lib/trust-safety/enforcement-service";

/**
 * POST /api/admin/trust-safety/actions/refund
 * Body: { incidentId: string, bookingId?: string, reasonCode?: string, notes?: string }
 * Issues refund for the incident's booking (or specified bookingId). Marks booking as refunded.
 */
export async function POST(request: NextRequest) {
  try {
    const createdBy = await getGuestId();
    if (!createdBy) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const incidentId = body?.incidentId;
    if (!incidentId) return Response.json({ error: "incidentId required" }, { status: 400 });

    const { actionId } = await applyEnforcement({
      incidentId,
      actionType: "REFUND",
      reasonCode: body?.reasonCode ?? "REFUND_APPROVED",
      notes: body?.notes,
      createdBy,
      bookingId: body?.bookingId,
    });
    return Response.json({ actionId, message: "Refund applied." });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to apply refund" },
      { status: 400 }
    );
  }
}
