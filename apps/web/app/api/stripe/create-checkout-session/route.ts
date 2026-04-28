/**
 * POST /api/stripe/create-checkout-session
 * LECIPM monetization wrapper — delegates to Stripe Checkout + writes `LecipmMonetizationTransaction` (pending).
 * Canonical low-level route remains POST /api/stripe/checkout.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveCheckoutUserId } from "@/lib/auth/resolve-checkout-user";
import { createCheckoutSession, type PaymentType } from "@/lib/stripe/checkout";
import { isStripeConfigured } from "@/lib/stripe";
import { describeStripeSecretKeyError } from "@/lib/stripe/stripeEnvGate";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordLecipmMonetizationTransaction } from "@/lib/monetization/lecipm-financial-operations";
import { lecipmMonetizationSystemV1 } from "@/config/feature-flags";
import { trackMonetizationCheckoutSessionCreated } from "@/lib/analytics/monetization-analytics";
import { stripeSecretBlockedInTestMode } from "@/lib/stripe/test-mode-stripe-guard";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const PAYMENT_TYPES: PaymentType[] = [
  "booking",
  "subscription",
  "lead_unlock",
  "mortgage_contact_unlock",
  "deposit",
  "closing_fee",
  "featured_listing",
  "fsbo_publish",
];

const BodyZ = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  amountCents: z.number().int().positive(),
  currency: z.string().max(8).optional(),
  paymentType: z.enum([
    "booking",
    "subscription",
    "lead_unlock",
    "mortgage_contact_unlock",
    "deposit",
    "closing_fee",
    "featured_listing",
    "fsbo_publish",
  ]),
  listingId: z.string().optional(),
  bookingId: z.string().optional(),
  dealId: z.string().optional(),
  brokerId: z.string().optional(),
  fsboListingId: z.string().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  if (!lecipmMonetizationSystemV1.stripeMonetizationApiV1) {
    return NextResponse.json({ error: "LECIPM Stripe monetization API disabled" }, { status: 403 });
  }
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured", detail: describeStripeSecretKeyError() },
      { status: 503 }
    );
  }
  const testBlock = stripeSecretBlockedInTestMode();
  if (testBlock) {
    return NextResponse.json({ error: testBlock }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`stripe:create-checkout-session:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  const userId = await resolveCheckoutUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = BodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;
  if (!PAYMENT_TYPES.includes(b.paymentType)) {
    return NextResponse.json({ error: "Unsupported paymentType" }, { status: 400 });
  }

  const session = await createCheckoutSession({
    successUrl: b.successUrl,
    cancelUrl: b.cancelUrl,
    amountCents: b.amountCents,
    currency: b.currency,
    paymentType: b.paymentType,
    userId,
    listingId: b.listingId,
    bookingId: b.bookingId,
    dealId: b.dealId,
    brokerId: b.brokerId,
    fsboListingId: b.fsboListingId,
    description: b.description,
    metadata: b.metadata,
  });

  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: 503 });
  }

  const tx = await recordLecipmMonetizationTransaction({
    userId,
    type: `checkout_${b.paymentType}`,
    amount: b.amountCents / 100,
    currency: b.currency ?? "CAD",
    status: "checkout_session_created",
    metadata: {
      sessionId: session.sessionId,
      paymentType: b.paymentType,
      idempotencyKey: request.headers.get("x-idempotency-key") ?? undefined,
    },
  });

  trackMonetizationCheckoutSessionCreated({
    paymentType: b.paymentType,
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
