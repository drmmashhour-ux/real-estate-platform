import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getTimelineEvents } from "@/lib/transaction-timeline";

/**
 * GET /api/transaction-timeline/:transactionId/events
 * Query: limit (default 50)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    await getGuestId();
    const { transactionId } = await context.params;
    const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 50, 100);
    const events = await getTimelineEvents(transactionId, limit);
    return Response.json({ events });
  } catch (e) {
    return Response.json({ error: "Failed to load events" }, { status: 500 });
  }
}
