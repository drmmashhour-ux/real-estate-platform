import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { calculateTransactionFee } from "@/lib/monetization/calculators";

/**
 * POST /api/monetization/transaction-fees/calculate
 * Body: { transactionValueCents, feePercent? }
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const transactionValueCents = body.transactionValueCents;
    if (typeof transactionValueCents !== "number" || transactionValueCents < 0) {
      return Response.json({ error: "transactionValueCents required (number >= 0)" }, { status: 400 });
    }
    const result = calculateTransactionFee({
      transactionValueCents,
      feePercent: body.feePercent,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Calculation failed" }, { status: 500 });
  }
}
