import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createTimelineForTransaction, getTimelineByTransactionId } from "@/lib/transaction-timeline";

/**
 * GET /api/transaction-timeline/:id (id = transactionId)
 * Returns the timeline for the transaction (creates one if missing).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: transactionId } = await context.params;
    const existingTimeline = await getTimelineByTransactionId(transactionId);
    const timeline = existingTimeline ?? (await createTimelineForTransaction(transactionId));
    if (!timeline) return Response.json({ error: "Timeline not found" }, { status: 404 });
    return Response.json(timeline);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load timeline";
    return Response.json({ error: message }, { status: 400 });
  }
}
