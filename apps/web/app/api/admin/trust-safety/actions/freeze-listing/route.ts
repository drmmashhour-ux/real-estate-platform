import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { applyEnforcement } from "@/lib/trust-safety/enforcement-service";

/**
 * POST /api/admin/trust-safety/actions/freeze-listing
 * Body: { incidentId: string, listingId?: string, reasonCode: string, notes?: string }
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
      actionType: "LISTING_FREEZE",
      reasonCode,
      notes: body?.notes,
      createdBy,
      listingId: body?.listingId,
    });
    return Response.json({ actionId, message: "Listing frozen." });
  } catch (e) {
    return Response.json({ error: "Failed to freeze listing" }, { status: 400 });
  }
}
