/**
 * POST /api/stripe/create-subscription
 * Host Pro/Growth subscription checkout — delegates to workspace Stripe session + audit log row.
 * Also see POST /api/stripe/checkout/subscription.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { isStripeConfigured } from "@/lib/stripe";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { engineFlags, lecipmMonetizationSystemV1 } from "@/config/feature-flags";
import { createHostSubscriptionCheckoutSession } from "@/modules/stripe/subscription-checkout.service";
import { recordLecipmMonetizationTransaction } from "@/lib/monetization/lecipm-financial-operations";
import { trackMonetizationSubscriptionCheckoutStarted } from "@/lib/analytics/monetization-analytics";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  planKey: z.enum(["pro", "growth"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  if (!lecipmMonetizationSystemV1.stripeMonetizationApiV1) {
    return NextResponse.json({ error: "LECIPM Stripe monetization API disabled" }, { status: 403 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  if (!engineFlags.subscriptionsV1) {
    return NextResponse.json({ error: "FEATURE_SUBSCRIPTIONS_V1 disabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const rl = checkRateLimit(`stripe:create-subscription:${userId}`, { windowMs: 60_000, max: 12 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const session = await createHostSubscriptionCheckoutSession({
    userId,
    userEmail: user.email,
    planKey: parsed.data.planKey,
    successUrl: parsed.data.successUrl,
    cancelUrl: parsed.data.cancelUrl,
  });

  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: 503 });
  }

  const tx = await recordLecipmMonetizationTransaction({
    userId,
    type: "subscription_checkout_session",
    amount: 0,
    status: "checkout_session_created",
    metadata: {
      sessionId: session.sessionId,
      planKey: parsed.data.planKey,
    },
  });

  trackMonetizationSubscriptionCheckoutStarted({
    planKey: parsed.data.planKey,
    sessionId: session.sessionId,
    transactionId: tx.id,
  });

  return NextResponse.json({
    ok: true,
    url: session.url,
    sessionId: session.sessionId,
    transactionId: tx.id,
  });
}
