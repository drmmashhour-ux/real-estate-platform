import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { assertSybnbPaymentCompleteAsync } from "@/lib/sybnb/payment-policy";
import { buildStubPaymentIntentId } from "@/lib/sybnb/stripe-checkout-stub";
import { appendSyriaSybnbCoreAudit } from "@/lib/sybnb/sybnb-financial-audit";
import { getActiveSybnbPaymentProviderId } from "@/lib/sybnb/sybnb-payment-provider";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";
import { isInvestorDemoModeActive } from "@/lib/sybnb/investor-demo";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { firstZodIssueMessage, sybnbFail, sybnbJson } from "@/lib/sybnb/sybnb-api-http";
import { sybnbPaymentIntentBody } from "@/lib/sybnb/sybnb-api-schemas";
import { sybnbApiCatch } from "@/lib/sybnb/sybnb-api-catch";

const SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED = process.env.SYBNB_PAYMENT_IDEMPOTENCY_REQUIRED === "true";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a stub id when all SYBNB payment gates pass. Live Stripe is not wired in this app until legal approval. SYBNB-7: zod + uniform errors.
 */
async function handlePaymentIntentPOST(req: Request): Promise<Response> {
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
    if (process.env.APP_ENV === "production") {
      const prodLockAck =
        process.env.PRODUCTION_LOCK_MODE === "true" || process.env.SYBNB_PRODUCTION_LOCK_MODE !== "false";
      if (!prodLockAck) {
        return sybnbFail("Production lock must be enabled in demo mode", 403);
      }
    }
    console.warn("[DEMO MODE]", { action: "payment_blocked", timestamp: new Date().toISOString() });
    return sybnbFail("Payment safely blocked in demo mode", 403);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return sybnbFail("Invalid JSON", 400);
  }
  const parsed = sybnbPaymentIntentBody.safeParse(raw);
  if (!parsed.success) {
    return sybnbFail(firstZodIssueMessage(parsed.error), 400);
  }

  const { bookingId, idempotencyKey } = parsed.data;
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
      action: "payment_intent_request",
      userId: user.id,
      bookingId: booking.id,
      metadata: { propertyId: booking.propertyId },
    });

    const gate = await assertSybnbPaymentCompleteAsync(booking.property, booking.property.owner, booking, user.id);
    if (!gate.ok) {
      void appendSyriaSybnbCoreAudit({
        bookingId: booking.id,
        event: "payment_intent_blocked",
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

    const paymentIntentId = buildStubPaymentIntentId(booking.id);
    await appendSyriaSybnbCoreAudit({
      bookingId: booking.id,
      event: "payment_intent_stub_issued",
      metadata: { paymentIntentId, provider: getActiveSybnbPaymentProviderId(), userId: user.id },
    });

    return sybnbJson({
      clientSecret: null,
      paymentIntentId,
      mode: "stub",
      message: "Stripe not activated for this region. No charge created.",
    });
  } catch (e) {
    console.error("[SYBNB] payment-intent failed", e instanceof Error ? e.message : e);
    return sybnbFail("server_error", 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  return sybnbApiCatch(() => handlePaymentIntentPOST(req));
}
