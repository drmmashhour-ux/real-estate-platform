import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { recordDeposit } from "@/lib/transactions/deposits";
import { ensureClosingSteps } from "@/lib/transactions/steps";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { DEPOSIT_PAYMENT_STATUSES } from "@/lib/transactions/constants";

/**
 * POST /api/transactions/:id/deposit
 * Body: amount (cents), payment_provider, payment_status (pending|paid|refunded), external_ref?
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
    const amount = Number(body.amount);
    const paymentProvider = body.payment_provider as string;
    const paymentStatus = body.payment_status as string;
    const externalRef = body.external_ref as string | undefined;

    if (!id || Number.isNaN(amount) || amount <= 0 || !paymentProvider || !DEPOSIT_PAYMENT_STATUSES.includes(paymentStatus as "pending" | "paid" | "refunded")) {
      return Response.json(
        { error: "transaction id, amount (positive), payment_provider, and payment_status (pending|paid|refunded) required" },
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

    const result = await recordDeposit({
      transactionId: id,
      amount,
      paymentProvider,
      paymentStatus: paymentStatus as "pending" | "paid" | "refunded",
      externalRef: externalRef ?? null,
    });

    if (paymentStatus === "paid") {
      await ensureClosingSteps(id);
    }

    return Response.json({
      deposit_id: result.depositId,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Deposit failed" },
      { status: 500 }
    );
  }
}
