/**
 * POST /api/stripe/mortgage-expert/credits — one-time Checkout for pay-per-lead credits.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMortgageExpertWithTerms } from "@/modules/mortgage/services/expert-guard";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";
import {
  getStripeMortgageLeadCreditPriceId,
  MORTGAGE_EXPERT_CHECKOUT_PAYMENT_CREDITS,
} from "@/lib/stripe/mortgage-expert-billing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });

  const session = await requireMortgageExpertWithTerms();
  if ("error" in session) return session.error;

  const rl = checkRateLimit(`stripe:mortgage_credits:${session.expert.id}`, {
    windowMs: 60_000,
    max: 16,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const body = await req.json().catch(() => ({}));
  const qty = Math.max(1, Math.min(500, Math.round(Number(body.quantity) || 1)));

  const priceId = getStripeMortgageLeadCreditPriceId();
  if (!priceId) {
    return NextResponse.json(
      { error: "Credit unit price not configured. Set STRIPE_PRICE_MORTGAGE_LEAD_CREDIT_UNIT in .env." },
      { status: 503 }
    );
  }

  const expert = await prisma.mortgageExpert.findUnique({
    where: { id: session.expert.id },
    select: { id: true, email: true, expertBilling: true },
  });
  if (!expert) return NextResponse.json({ error: "Expert not found" }, { status: 404 });

  let customerId = expert.expertBilling?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: expert.email ?? undefined,
      metadata: { mortgageExpertId: expert.id },
    });
    customerId = customer.id;
    await prisma.expertBilling.upsert({
      where: { expertId: expert.id },
      create: {
        expertId: expert.id,
        stripeCustomerId: customerId,
        plan: "basic",
        status: "active",
      },
      update: { stripeCustomerId: customerId },
    });
  }

  const base = stripeAppBaseUrl(req);
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: qty }],
    success_url: `${base}/dashboard/expert/billing?credits=success`,
    cancel_url: `${base}/dashboard/expert/billing?credits=cancel`,
    metadata: {
      paymentType: MORTGAGE_EXPERT_CHECKOUT_PAYMENT_CREDITS,
      expertId: expert.id,
      creditsQty: String(qty),
    },
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "Checkout session missing redirect URL" }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.url, quantity: qty });
}
