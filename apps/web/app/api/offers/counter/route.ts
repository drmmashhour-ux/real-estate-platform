import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { counterOffer } from "@/lib/transactions/offers";

/**
 * POST /api/offers/counter
 * Body: offer_id, counter_price (cents), notes?
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const offerId = body.offer_id as string;
    const counterPrice = Number(body.counter_price);
    const notes = body.notes as string | undefined;

    if (!offerId || Number.isNaN(counterPrice) || counterPrice <= 0) {
      return Response.json(
        { error: "offer_id and counter_price (positive number) are required" },
        { status: 400 }
      );
    }

    const result = await counterOffer({
      offerId,
      counterPrice,
      notes: notes ?? null,
      createdById: userId,
    });

    return Response.json({
      counter_offer_id: result.counterOfferId,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Counter offer failed" },
      { status: 500 }
    );
  }
}
