import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { completeStep } from "@/lib/transactions/steps";
import { prisma } from "@/lib/db";
import { CLOSING_STEP_NAMES } from "@/lib/transactions/constants";

/**
 * POST /api/transactions/:id/complete-step
 * Body: step_name (inspection|financing_approval|legal_review|final_payment|ownership_transfer)
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
    const stepName = body.step_name as string;

    if (!id || !stepName) {
      return Response.json({ error: "step_name is required" }, { status: 400 });
    }
    if (!CLOSING_STEP_NAMES.includes(stepName as "inspection" | "financing_approval" | "legal_review" | "final_payment" | "ownership_transfer")) {
      return Response.json(
        { error: "step_name must be one of: inspection, financing_approval, legal_review, final_payment, ownership_transfer" },
        { status: 400 }
      );
    }

    const tx = await prisma.realEstateTransaction.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true, brokerId: true },
    });
    if (!tx) return Response.json({ error: "Transaction not found" }, { status: 404 });
    const isParty = [tx.buyerId, tx.sellerId, tx.brokerId].filter(Boolean).includes(userId);
    if (!isParty) return Response.json({ error: "Access denied" }, { status: 403 });

    await completeStep({
      transactionId: id,
      stepName,
      completedById: userId,
    });

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Complete step failed" },
      { status: 500 }
    );
  }
}
