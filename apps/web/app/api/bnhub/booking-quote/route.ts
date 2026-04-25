import { NextResponse } from "next/server";
import { calculateBookingTotalCents } from "@/lib/bnhub/booking-revenue-pricing";
import type { BnhubUpsellSelection } from "@/lib/monetization/bnhub-checkout-pricing";

/**
 * POST JSON: { nightPriceCents, nights, extrasCents?, upsells? }
 * Returns transparent cents breakdown for BNHub checkout UIs.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const nightPriceCents = Math.max(0, Math.round(Number(o.nightPriceCents)));
  const nights = Math.max(1, Math.floor(Number(o.nights) || 1));
  const extrasCents = Math.max(0, Math.round(Number(o.extrasCents) || 0));
  const upsells = (typeof o.upsells === "object" && o.upsells !== null ? o.upsells : {}) as BnhubUpsellSelection;

  if (!Number.isFinite(nightPriceCents) || !Number.isFinite(nights)) {
    return NextResponse.json({ error: "nightPriceCents and nights required" }, { status: 400 });
  }

  const b = calculateBookingTotalCents(nightPriceCents, nights, { extrasCents, upsells });

  return NextResponse.json({
    nightPriceCents,
    nights,
    baseAmountCents: b.baseAmountCents,
    serviceFeeCents: b.serviceFeeCents,
    serviceFeePercent: b.serviceFeePercent,
    totalCents: b.totalCents,
    hostReceivesCents: b.hostReceivesCents,
    upsellsCents: b.upsellsCents,
  });
}
