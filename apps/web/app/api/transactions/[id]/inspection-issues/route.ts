import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordTransactionEvent } from "@/lib/transactions/events";

/**
 * POST /api/transactions/:id/inspection-issues
 * Body: { issues: string[] }
 * Records inspection issues for the transaction (e.g. before renegotiation or cancel).
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
    const raw = body.issues;
    const issues = Array.isArray(raw)
      ? (raw as unknown[]).map((x) => (typeof x === "string" ? x : String(x))).filter(Boolean)
      : [];

    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true, brokerId: true },
    });
    if (!tx) return Response.json({ error: "Transaction not found" }, { status: 404 });

    const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
    if (!isParty) return Response.json({ error: "Access denied" }, { status: 403 });

    await recordTransactionEvent(
      id,
      "inspection_issues_marked",
      { issues },
      userId
    );

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to record inspection issues" },
      { status: 500 }
    );
  }
}
