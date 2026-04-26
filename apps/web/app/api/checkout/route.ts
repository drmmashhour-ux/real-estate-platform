import { stripe } from "@/lib/stripe";
import {
  assertHostReady,
  isHostNotReadyToReceivePaymentsError,
} from "@/lib/stripe/assert-host-ready";
import { bnhubStripeApplicationFeeCents } from "@/lib/stripe/bnhub-connect";
import { MARKETPLACE_LISTING_CHECKOUT } from "@/lib/marketplace/booking-hold";
import { marketplacePrisma, monolithPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_ORIGIN = "http://localhost:3001";

/**
 * Minimal Hosted Checkout for BNHub / booking demos (`mode: payment`, dynamic `price_data`).
 *
 * **Production** booking and Connect flows should use `POST /api/stripe/checkout` (webhook is source of truth for paid state).
 */
export async function POST(req: Request) {
  if (!stripe) {
    return Response.json(
      { error: "Stripe is not configured (set STRIPE_SECRET_KEY or disable demo mode)" },
      { status: 503 },
    );
  }

  let body: {
    amount?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
    /** Shown as Checkout line item title (default: "Booking"). */
    productName?: unknown;
    /** When set, funds route to the listing owner’s Connect account (if `stripeAccountId` is present). */
    listingId?: unknown;
    /** Attached to the Stripe object for ops / reconciliation (string values only). */
    metadata?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  if (!Number.isInteger(amount) || amount < 50) {
    return Response.json(
      { error: "amount must be an integer >= 50 (USD cents, Stripe minimum)" },
      { status: 400 },
    );
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() || DEFAULT_ORIGIN;
  const successUrl =
    typeof body.successUrl === "string" && body.successUrl.trim()
      ? body.successUrl.trim()
      : `${base}/success`;
  const cancelUrl =
    typeof body.cancelUrl === "string" && body.cancelUrl.trim()
      ? body.cancelUrl.trim()
      : `${base}/cancel`;

  const productName =
    typeof body.productName === "string" && body.productName.trim()
      ? body.productName.trim()
      : "Booking";

  const metadata: Record<string, string> = {};
  if (body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
    for (const [k, v] of Object.entries(body.metadata as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      metadata[k] = String(v);
      if (metadata[k].length > 500) metadata[k] = metadata[k].slice(0, 500);
    }
  }
  /** Webhook + Stripe dashboard: canonical camelCase; clients may send `booking_id` from demos. */
  if (metadata.booking_id && !metadata.bookingId) {
    metadata.bookingId = metadata.booking_id;
  }
  if (metadata.listing_id && !metadata.listingId) {
    metadata.listingId = metadata.listing_id;
  }
  if (metadata.bookingId && metadata.listingId && !metadata.paymentType) {
    metadata.paymentType = MARKETPLACE_LISTING_CHECKOUT;
  }

  let paymentIntentData:
    | {
        transfer_data: { destination: string };
        application_fee_amount?: number;
      }
    | undefined;

  const listingIdRaw =
    typeof body.listingId === "string" ? body.listingId.trim() : String(body.listingId ?? "").trim();
  if (listingIdRaw) {
    const listing = await marketplacePrisma.listing.findUnique({
      where: { id: listingIdRaw },
      select: { userId: true },
    });
    if (listing?.userId) {
      const host = await monolithPrisma.user.findUnique({
        where: { id: listing.userId },
        select: { stripeAccountId: true },
      });
      const destination = host?.stripeAccountId?.trim();
      if (destination) {
        try {
          await assertHostReady(stripe, destination);
        } catch (e) {
          if (isHostNotReadyToReceivePaymentsError(e)) {
            return Response.json(
              { error: "Host is not ready to receive payments", code: e.code },
              { status: 400 }
            );
          }
          console.error("checkout: assertHostReady", e);
          return Response.json(
            { error: "Could not verify host payout account. Try again later." },
            { status: 502 }
          );
        }
        const applicationFee = bnhubStripeApplicationFeeCents(amount);
        paymentIntentData = { transfer_data: { destination } };
        if (applicationFee > 0 && applicationFee < amount) {
          paymentIntentData.application_fee_amount = applicationFee;
          metadata.application_fee_cents = String(applicationFee);
        }
        metadata.destinationAccountId = destination;
      }
    }
    metadata.listing_id = listingIdRaw;
  }

  const idempotencyKey =
    typeof metadata.bookingId === "string" && metadata.bookingId.trim()
      ? `checkout_${metadata.bookingId.trim()}`.slice(0, 255)
      : undefined;

  try {
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: productName,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
        ...(paymentIntentData ? { payment_intent_data: paymentIntentData } : {}),
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    if (!session.url) {
      return Response.json({ error: "Checkout session missing url" }, { status: 500 });
    }

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("checkout.sessions.create", e);
    return Response.json({ error: "Stripe error", detail: String(e) }, { status: 502 });
  }
}
