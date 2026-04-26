import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { recordTransactionEvent } from "@/lib/transactions/events";
import { cancelTimeline } from "@/lib/transaction-timeline";

/**
 * POST /api/transactions/:id/cancel
 * Body: { reason?: string }
 * Cancels the transaction and timeline (if any).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason = (body.reason as string) || "Cancelled by party";

    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id },
      select: { id: true, status: true, buyerId: true, sellerId: true, brokerId: true },
    });
    if (!tx) return Response.json({ error: "Transaction not found" }, { status: 404 });

    const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
    if (!isParty) return Response.json({ error: "Access denied" }, { status: 403 });

    if (tx.status === "cancelled") {
      return Response.json({ error: "Transaction is already cancelled" }, { status: 400 });
    }

    await prisma.realEstateTransaction.update({
      where: { id },
      data: { status: "cancelled" },
    });

    await recordTransactionEvent(id, "transaction_cancelled", { reason }, userId);

    const timeline = await prisma.transactionTimeline.findUnique({
      where: { transactionId: id },
      select: { id: true },
    });
    if (timeline) {
      await cancelTimeline(id, reason, userId);
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Cancel failed" },
      { status: 500 }
    );
  }
}
