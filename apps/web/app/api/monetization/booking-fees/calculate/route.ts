import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { calculateBookingFees } from "@/lib/monetization/calculators";

/**
 * POST /api/monetization/booking-fees/calculate
 * Body: { subtotalCents, cleaningFeeCents? }
 * Tax: Québec GST (5%) + QST (9.975% on subtotal+GST), same as booking-pricing / Stripe totals.
 */
export async function POST(request: NextRequest) {
  try {
    await getGuestId();
    const body = await request.json().catch(() => ({}));
    const subtotalCents = body.subtotalCents;
    if (typeof subtotalCents !== "number" || subtotalCents < 0) {
      return Response.json({ error: "subtotalCents required (number >= 0)" }, { status: 400 });
    }
    const result = calculateBookingFees({
      subtotalCents,
      cleaningFeeCents: body.cleaningFeeCents,
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Calculation failed" }, { status: 500 });
  }
}
