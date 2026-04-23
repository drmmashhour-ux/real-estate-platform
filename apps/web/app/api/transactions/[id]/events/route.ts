import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

/**
 * GET /api/transactions/:id/events
 * Transaction event history.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const { id } = await context.params;
    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true, brokerId: true },
    });
    if (!tx) {
      return Response.json({ error: "Transaction not found" }, { status: 404 });
    }
    const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
    if (!isParty) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const events = await prisma.transactionEvent.findMany({
      where: { transactionId: id },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({
      transaction_id: id,
      events: events.map((e) => ({
        id: e.id,
        event_type: e.eventType,
        event_data: e.eventData,
        created_by: e.createdById,
        created_at: e.createdAt,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}
