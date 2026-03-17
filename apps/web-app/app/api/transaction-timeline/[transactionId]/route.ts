import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createTimelineForTransaction, getTimelineByTransactionId } from "@/lib/transaction-timeline";

/**
 * GET /api/transaction-timeline/:transactionId
 * Returns the timeline for the transaction (creates one if missing).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    await getGuestId();
    const { transactionId } = await context.params;
    let timeline = await getTimelineByTransactionId(transactionId);
    if (!timeline) timeline = await createTimelineForTransaction(transactionId);
    if (!timeline) return Response.json({ error: "Timeline not found" }, { status: 404 });
    return Response.json(timeline);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load timeline";
    return Response.json({ error: message }, { status: 400 });
  }
}
