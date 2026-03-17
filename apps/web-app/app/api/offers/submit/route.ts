import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { submitOffer } from "@/lib/transactions/offers";

/**
 * POST /api/offers/submit
 * Body: transaction_id, offer_price (cents), conditions?, expiration_date? (ISO)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const transactionId = body.transaction_id as string;
    const offerPrice = Number(body.offer_price);
    const expirationDate = body.expiration_date ? new Date(body.expiration_date) : null;

    if (!transactionId || Number.isNaN(offerPrice) || offerPrice <= 0) {
      return Response.json(
        { error: "transaction_id and offer_price (positive number) are required" },
        { status: 400 }
      );
    }

    const result = await submitOffer({
      transactionId,
      buyerId: userId,
      offerPrice,
      conditions: body.conditions ?? undefined,
      expirationDate,
    });

    return Response.json({
      offer_id: result.offerId,
      status: result.status,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Submit offer failed" },
      { status: 500 }
    );
  }
}
