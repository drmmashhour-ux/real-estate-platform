import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { assertSybnbPaymentCompleteAsync } from "@/lib/sybnb/payment-policy";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { firstZodIssueMessage, sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";
import { sybnbCheckoutSessionBody } from "@/lib/sybnb/sybnb-api-schemas";
import { getStripeClient, sybnbAppBaseUrl, sybnbStayTotalUsdCents } from "@/lib/sybnb/stripe-server";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

const SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED = process.env.SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED === "true";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeLocale(raw: string | undefined): string {
  const l = raw?.trim().toLowerCase() ?? "";
  if (l.startsWith("ar")) return "ar";
  return "en";
}

/**
 * ORDER SYBNB-110 — Creates a Stripe Checkout Session (test `sk_test_*` only) for an approved stay booking.
 */
async function handleCheckoutSessionPOST(req: Request): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return sybnbFail("Service unavailable", 503);
  }

  const user = await getSessionUser();
  if (!user) {
    return sybnbFail("unauthorized", 401);
  }

  if (isInvestorDemoModeActive()) {
    return sybnbFail("Payment safely blocked in demo mode", 403);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return sybnbFail("Invalid JSON", 400);
  }
  const parsed = sybnbCheckoutSessionBody.safeParse(raw);
  if (!parsed.success) {
    return sybnbFail(firstZodIssueMessage(parsed.error), 400);
  }

  const { bookingId, idempotencyKey, locale } = parsed.data;
  if (SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED) {
    const idem = String(idempotencyKey ?? "").trim();
    if (!idem) {
      return sybnbFail("missing_idempotency_key", 400);
    }
  }

  try {
    const booking = await prisma.syriaBooking.findUnique({
      where: { id: bookingId },
      include: { property: { include: { owner: true } } },
    });
    if (!booking) {
      return sybnbFail("not_found", 404);
    }
    if (booking.property.category !== "stay") {
      return sybnbFail("not_sybnb_stay", 400);
    }

    await logSecurityEvent({
      action: "checkout_session_request",
      userId: user.id,
      bookingId: booking.id,
      metadata: { propertyId: booking.propertyId },
    });

    const gate = await assertSybnbPaymentCompleteAsync(booking.property, booking.property.owner, booking, user.id);
    if (!gate.ok) {
      void appendSyriaSybnbCoreAudit({
        bookingId: booking.id,
        event: "checkout_session_blocked",
        metadata: {
          reasonCode: gate.reason,
          riskCodes: gate.riskCodes ?? [],
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: "checkout_blocked",
          reason: gate.reason,
          detail: gate.detail,
          riskCodes: gate.riskCodes,
        },
        { status: 403 },
      );
    }

    const stripe = getStripeClient();
    const base = sybnbAppBaseUrl().replace(/\/$/, "");
    const loc = normalizeLocale(locale);
    const unitAmount = sybnbStayTotalUsdCents(booking.totalPrice, booking.nightsCount);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: booking.id,
      metadata: {
        bookingId: booking.id,
        propertyId: booking.propertyId,
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking.id,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: `Hadiah Link · stay ${booking.id.slice(0, 8)}`,
              description: `Approx. checkout in USD for Stripe test — booking total ${booking.totalPrice.toString()} ${booking.currency} (${booking.nightsCount} nights).`,
            },
          },
        },
      ],
      success_url: `${base}/${loc}/dashboard/bookings?sybnb_checkout=success`,
      cancel_url: `${base}/${loc}/dashboard/bookings?sybnb_checkout=cancel`,
    });

    await prisma.syriaBooking.update({
      where: { id: booking.id },
      data: { sybnbCheckoutSessionId: session.id },
    });

    await appendSyriaSybnbCoreAudit({
      bookingId: booking.id,
      event: "stripe_checkout_session_created",
      metadata: {
        checkoutSessionId: session.id,
        unitAmountUsdCents: unitAmount,
        userId: user.id,
      },
    });

    if (!session.url) {
      return sybnbFail("checkout_no_url", 500);
    }

    return sybnbJson({
      url: session.url,
      checkoutSessionId: session.id,
      mode: "stripe_checkout",
    });
  } catch (e) {
    console.error("[SYBNB] checkout-session failed", e instanceof Error ? e.message : e);
    return sybnbFail("server_error", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  return sybnbApiCatch(() => handleCheckoutSessionPOST(req));
}
