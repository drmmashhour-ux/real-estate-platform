import { NextRequest } from "next/server";
import Stripe from "stripe";
import { paymentsV8SafetyFlags } from "@/config/feature-flags";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PAID_STORAGE_PLAN_KEYS, plans, type PlanKey } from "@/lib/billing/plans";
import { assertCheckoutSessionIdShape, runV8SafePaymentOperation } from "@/lib/payments/v8-safety";

export const dynamic = "force-dynamic";

const VALID_PLANS: PlanKey[] = PAID_STORAGE_PLAN_KEYS;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

/**
 * POST /api/stripe/confirm
 * Body: { session_id: string }
 * After Stripe redirect: verify payment, then upgrade storage and create invoice.
 * Idempotent: repeated calls with same session_id do not create duplicate invoices.
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const currentUserId = await getGuestId();
    if (!currentUserId) {
      return Response.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = body?.session_id as string | undefined;
    if (!sessionId) {
      return Response.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    if (paymentsV8SafetyFlags.paymentsV8SafetyV1) {
      try {
        assertCheckoutSessionIdShape(sessionId);
      } catch {
        return Response.json({ error: "Invalid session_id format" }, { status: 400 });
      }
    }

    const session = await runV8SafePaymentOperation(
      "stripe.confirm.retrieveCheckoutSession",
      () =>
        stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["payment_intent"],
        }),
      {
        idempotencyKey: `stripe.confirm:${sessionId}`,
        timeoutMs: 15_000,
        maxRetries: 1,
      },
    );

    if (session.payment_status !== "paid") {
      return Response.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as string | undefined;
    if (!userId || !plan || !VALID_PLANS.includes(plan as PlanKey)) {
      return Response.json(
        { error: "Invalid session metadata" },
        { status: 400 }
      );
    }

    // Only allow confirming for the same user that started checkout
    if (userId !== currentUserId) {
      return Response.json({ error: "Session does not belong to this user" }, { status: 403 });
    }

    // Idempotency: already fulfilled
    const existing = await prisma.upgradeInvoice.findUnique({
      where: { stripePaymentId: sessionId },
    });
    if (existing) {
      return Response.json({
        success: true,
        alreadyFulfilled: true,
        plan,
        storageLabel: plans[plan as PlanKey].storageLabel,
      });
    }

    const planConfig = plans[plan as PlanKey];
    const limitBytes = planConfig.storage;
    const amount = planConfig.price;

    await prisma.userStorage.upsert({
      where: { userId },
      create: {
        userId,
        usedBytes: 0,
        limitBytes,
      },
      update: { limitBytes },
    });

    await prisma.user.updateMany({
      where: { id: userId },
      data: { plan },
    });

    await prisma.upgradeInvoice.create({
      data: {
        userId,
        amount,
        plan,
        stripePaymentId: sessionId,
      },
    });

    return Response.json({
      success: true,
      plan,
      limitBytes,
      amount,
      storageLabel: planConfig.storageLabel,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Confirmation failed" }, { status: 500 });
  }
}
