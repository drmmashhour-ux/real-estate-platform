import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { processPendingEvents } from "@/lib/platform-event-bus";

/**
 * POST /api/admin/event-bus/process-pending
 * Body: { limit?: number }
 * Process pending events from the log (dispatch to consumers).
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit) || 50, 200);
    const result = await processPendingEvents(limit);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Failed to process pending events" }, { status: 500 });
  }
}
