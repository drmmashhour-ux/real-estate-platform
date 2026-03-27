import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { hostRespondToDispute } from "@/lib/trust-safety/dispute-service";

/**
 * POST /api/bnhub/disputes/:id/respond
 * Host responds to the dispute. Body: { message: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const hostId = await getGuestId();
    if (!hostId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id: disputeId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const message = body?.message;
    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ error: "message required" }, { status: 400 });
    }

    await hostRespondToDispute(disputeId, hostId, message.trim());
    return Response.json({ success: true, message: "Response submitted." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to submit response";
    return Response.json({ error: msg }, { status: 400 });
  }
}
