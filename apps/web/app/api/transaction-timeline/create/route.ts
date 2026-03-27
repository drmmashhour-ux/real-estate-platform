import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { createTimelineForTransaction } from "@/lib/transaction-timeline";

/**
 * POST /api/transaction-timeline/create
 * Body: { transactionId: string }
 * Creates a timeline for the transaction if one does not exist.
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const transactionId = body.transactionId;
    if (!transactionId) return Response.json({ error: "transactionId required" }, { status: 400 });
    const timeline = await createTimelineForTransaction(transactionId);
    return Response.json(timeline);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create timeline";
    return Response.json({ error: message }, { status: 400 });
  }
}
