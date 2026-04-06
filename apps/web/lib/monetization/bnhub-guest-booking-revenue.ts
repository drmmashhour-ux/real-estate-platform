/**
 * Records Prisma `PlatformRevenueEvent` rows when a Supabase guest booking is marked paid via Stripe,
 * so admin dashboards can track GMV, service fees, and upsell attach (itemized checkout).
 */

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { recordRevenueEvent } from "@/lib/monetization/revenue-events";

const REF_PREFIX = "stripe_guest_checkout:";

function metaInt(md: Stripe.Metadata | null | undefined, key: string): number {
  if (!md) return 0;
  const v = md[key];
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Idempotent per Stripe Checkout session (webhook retries safe).
 */
export async function recordBnhubGuestBookingRevenueFromPaidSession(
  session: Stripe.Checkout.Session,
  bookingId: string
): Promise<void> {
  const ref = `${REF_PREFIX}${session.id}`;
  const existing = await prisma.platformRevenueEvent.findFirst({
    where: { sourceReference: ref, revenueType: "bnhub_guest_booking_gmv" },
    select: { id: true },
  });
  if (existing) return;

  const md = session.metadata ?? {};
  const currency = (session.currency ?? "usd").toUpperCase();
  const gmv = session.amount_total ?? 0;

  await recordRevenueEvent({
    entityType: "guest_supabase_booking",
    entityId: bookingId,
    revenueType: "bnhub_guest_booking_gmv",
    amountCents: gmv,
    currency,
    sourceReference: ref,
    status: "realized",
  });

  const feeTotal = metaInt(md, "serviceFeeBaseCents") + metaInt(md, "serviceFeePeakCents");
  if (feeTotal > 0) {
    await recordRevenueEvent({
      entityType: "guest_supabase_booking",
      entityId: bookingId,
      revenueType: "bnhub_guest_booking_service_fee",
      amountCents: feeTotal,
      currency,
      sourceReference: `${ref}:fee`,
      status: "realized",
    });
  }

  const upsellTotal =
    metaInt(md, "upsellInsuranceCents") +
    metaInt(md, "upsellEarlyCents") +
    metaInt(md, "upsellLateCents");
  if (upsellTotal > 0) {
    await recordRevenueEvent({
      entityType: "guest_supabase_booking",
      entityId: bookingId,
      revenueType: "bnhub_guest_booking_upsell",
      amountCents: upsellTotal,
      currency,
      sourceReference: `${ref}:upsell`,
      status: "realized",
    });
  }
}
