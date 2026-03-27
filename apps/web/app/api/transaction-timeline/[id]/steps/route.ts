import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getTimelineSteps, createTimelineForTransaction, getTimelineByTransactionId } from "@/lib/transaction-timeline";

/**
 * GET /api/transaction-timeline/:id/steps (id = transactionId)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getGuestId();
    const { id: transactionId } = await context.params;
    let steps = await getTimelineSteps(transactionId);
    if (steps.length === 0) {
      const timeline = await getTimelineByTransactionId(transactionId);
      if (!timeline) await createTimelineForTransaction(transactionId);
      steps = await getTimelineSteps(transactionId);
    }
    return Response.json({ steps });
  } catch (e) {
    return Response.json({ error: "Failed to load steps" }, { status: 500 });
  }
}
