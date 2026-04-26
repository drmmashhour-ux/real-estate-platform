import type Stripe from "stripe";

import { marketplacePrisma } from "@/lib/db";

function isP2002(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

function listingIdFromSessionMetadata(
  md: Stripe.Metadata | null | undefined
): string | null {
  if (!md) return null;
  const a = typeof md.listingId === "string" ? md.listingId.trim() : "";
  const b = typeof md.listing_id === "string" ? md.listing_id.trim() : "";
  return a || b || null;
}

function applicationFeeCentsFromSession(session: Stripe.Checkout.Session): number {
  if (typeof session.application_fee_amount === "number") {
    return session.application_fee_amount;
  }
  const raw = session.metadata?.application_fee_cents;
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number(raw);
  }
  return 0;
}

/**
 * Order 67 — append-only payment log for marketplace listing Checkout (gross, fee, Stripe ids, optional destination).
 * Idempotent on `stripe_checkout_session_id` (webhook retries).
 */
export async function recordMarketplacePaymentLedgerFromCheckoutSession(
  session: Stripe.Checkout.Session,
  ctx: { bookingId: string; destinationAccountId?: string | null }
): Promise<void> {
  const amountCents = session.amount_total ?? 0;
  const listingId = listingIdFromSessionMetadata(session.metadata);
  const dest =
    ctx.destinationAccountId?.trim() ||
    (typeof session.metadata?.destinationAccountId === "string"
      ? session.metadata.destinationAccountId.trim()
      : null) ||
    null;
  const piRaw = session.payment_intent;
  const stripePaymentIntentId =
    typeof piRaw === "string"
      ? piRaw
      : piRaw && typeof piRaw === "object" && "id" in piRaw
        ? String((piRaw as { id: string }).id)
        : null;

  try {
    await marketplacePrisma.marketplacePaymentLedger.create({
      data: {
        listingId: listingId ?? null,
        bookingId: ctx.bookingId,
        amountCents,
        applicationFeeCents: applicationFeeCentsFromSession(session),
        stripePaymentIntentId: stripePaymentIntentId ?? null,
        stripeCheckoutSessionId: session.id,
        destinationAccountId: dest,
      },
    });
  } catch (e) {
    if (isP2002(e)) {
      return;
    }
    throw e;
  }
}
