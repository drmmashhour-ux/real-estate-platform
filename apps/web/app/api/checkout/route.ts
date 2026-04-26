import { stripe } from "@/lib/stripe";
import {
  assertHostReady,
  isHostNotReadyToReceivePaymentsError,
} from "@/lib/stripe/assert-host-ready";
import { bnhubStripeApplicationFeeCents } from "@/lib/stripe/bnhub-connect";
import {
  computeHoldExpiry,
  MARKETPLACE_LISTING_CHECKOUT,
  whereRangeBlocksListing,
} from "@/lib/marketplace/booking-hold";
import { assertSafeUsage, authPrisma, getListingsDB, bnhubDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";
import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import { track } from "@/lib/analytics/events";

export const dynamic = "force-dynamic";

const DEFAULT_ORIGIN = "http://localhost:3001";

class BookingDateConflictError extends Error {
  constructor() {
    super("Dates not available");
    this.name = "BookingDateConflictError";
  }
}

function isOverlapDbError(e: unknown): boolean {
  const s = String(e);
  if (s.includes("no_overlap_booking")) return true;
  if (s.includes("23P01")) return true;
  if (s.toLowerCase().includes("exclusion") && s.toLowerCase().includes("violation")) return true;
  return false;
}

void bnhubDB;

/**
 * Minimal Hosted Checkout for marketplace listings (`mode: payment`, dynamic `price_data`).
 *
 * - `listingId` + `startDate` + `endDate` + auth → `pending` booking on `listingsDB`, Stripe `metadata`
 *   `booking_id` + `listing_id` (source of truth for webhooks / ledger).
 * - `listingId` only (no dates) — legacy: Connect routing from host `stripeAccountId` only.
 * - Stripe session creation and Connect logic stay on the existing Stripe / monolith-integrated path.
 */
export async function POST(req: Request) {
  assertSafeUsage("checkout route");
  if (!stripe) {
    return Response.json(
      { error: "Stripe is not configured (set STRIPE_SECRET_KEY or disable demo mode)" },
      { status: 503 }
    );
  }

  let body: {
    amount?: unknown;
    successUrl?: unknown;
    cancelUrl?: unknown;
    productName?: unknown;
    listingId?: unknown;
    startDate?: unknown;
    endDate?: unknown;
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
      { status: 400 }
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
  if (metadata.booking_id && !metadata.bookingId) {
    metadata.bookingId = metadata.booking_id;
  }
  if (metadata.listing_id && !metadata.listingId) {
    metadata.listingId = metadata.listing_id;
  }
  if (metadata.bookingId && metadata.listingId && !metadata.paymentType) {
    metadata.paymentType = MARKETPLACE_LISTING_CHECKOUT;
  }

  const listingIdRaw =
    typeof body.listingId === "string" ? body.listingId.trim() : String(body.listingId ?? "").trim();
  const startRaw = typeof body.startDate === "string" ? body.startDate.trim() : "";
  const endRaw = typeof body.endDate === "string" ? body.endDate.trim() : "";
  const hasBookingWindow = Boolean(listingIdRaw && startRaw && endRaw);

  let createdBooking: { id: string } | null = null;
  let connectListing: { id: string; userId: string } | null = null;

  if (hasBookingWindow) {
    const user = requireAuth(req);
    if (!user || typeof user !== "object" || !("userId" in user)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (user as { userId: string }).userId;

    const listing = await listDb.listing.findUnique({
      where: { id: listingIdRaw },
      select: { id: true, userId: true },
    });
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    connectListing = listing;

    const startDate = toDateOnlyFromString(startRaw);
    const endDate = toDateOnlyFromString(endRaw);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return Response.json({ error: "Invalid startDate or endDate" }, { status: 400 });
    }
    if (endDate <= startDate) {
      return Response.json({ error: "endDate must be after startDate" }, { status: 400 });
    }

    console.log("[CHECKOUT] using getListingsDB() for booking");
    try {
      createdBooking = await listDb.$transaction(async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: whereRangeBlocksListing(listingIdRaw, startDate, endDate),
        });
        if (conflict) {
          throw new BookingDateConflictError();
        }
        return tx.booking.create({
          data: {
            userId,
            listingId: listingIdRaw,
            startDate,
            endDate,
            status: "pending",
            expiresAt: computeHoldExpiry(),
          },
        });
      });
    } catch (e) {
      if (e instanceof BookingDateConflictError) {
        return Response.json({ error: e.message, code: "BOOKING_CONFLICT" }, { status: 409 });
      }
      if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
        return Response.json(
          { error: "A booking for these dates already exists. Refresh and try again.", code: "BOOKING_DUPLICATE" },
          { status: 409 }
        );
      }
      if (isOverlapDbError(e)) {
        return Response.json({ error: "Dates not available", code: "BOOKING_CONFLICT" }, { status: 409 });
      }
      console.error("checkout: booking create", e);
      return Response.json(
        { error: "Could not create booking", detail: String(e) },
        { status: 500 }
      );
    }

    metadata.booking_id = createdBooking.id;
    metadata.listing_id = listing.id;
    if (!metadata.bookingId) metadata.bookingId = createdBooking.id;
    if (!metadata.listingId) metadata.listingId = listing.id;
    metadata.paymentType = MARKETPLACE_LISTING_CHECKOUT;
  } else if (listingIdRaw) {
    connectListing = await listDb.listing.findUnique({
      where: { id: listingIdRaw },
      select: { id: true, userId: true },
    });
  }

  let paymentIntentData:
    | {
        transfer_data: { destination: string };
        application_fee_amount?: number;
      }
    | undefined;

  if (connectListing?.userId) {
    const host = await authPrisma.user.findUnique({
      where: { id: connectListing.userId },
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
  if (listingIdRaw) {
    if (!metadata.listing_id) {
      metadata.listing_id = listingIdRaw;
    }
    if (!metadata.listingId) {
      metadata.listingId = listingIdRaw;
    }
  }

  const idempotencyKey =
    typeof metadata.bookingId === "string" && metadata.bookingId.trim()
      ? `checkout_${metadata.bookingId.trim()}`.slice(0, 255)
      : undefined;

  /** Echo session keys onto the PaymentIntent so `payment_intent.*` webhooks can resolve `booking_id`. */
  const paymentIntentMetadata: Record<string, string> = {};
  for (const key of [
    "booking_id",
    "listing_id",
    "bookingId",
    "listingId",
    "paymentType",
    "userId",
  ] as const) {
    const v = metadata[key];
    if (typeof v === "string" && v.trim()) paymentIntentMetadata[key] = v.trim();
  }
  const mergedPaymentIntentData =
    paymentIntentData || Object.keys(paymentIntentMetadata).length > 0
      ? {
          ...(paymentIntentData ?? {}),
          ...(Object.keys(paymentIntentMetadata).length > 0
            ? { metadata: paymentIntentMetadata }
            : {}),
        }
      : undefined;

  if (listingIdRaw) {
    void track("checkout_started", { listingId: listingIdRaw });
  }

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
        ...(mergedPaymentIntentData ? { payment_intent_data: mergedPaymentIntentData } : {}),
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    if (!session.url) {
      return Response.json({ error: "Checkout session missing url" }, { status: 500 });
    }

    return Response.json({ url: session.url, bookingId: createdBooking?.id ?? null });
  } catch (e) {
    console.error("checkout.sessions.create", e);
    return Response.json({ error: "Stripe error", detail: String(e) }, { status: 502 });
  }
}
