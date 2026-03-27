/**
 * POST /api/stripe/connect/onboard — Stripe Connect Express onboarding (BNHub hosts + mortgage experts).
 */

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordPlatformEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

const DEFAULT_CONNECT_COUNTRY = (process.env.STRIPE_CONNECT_DEFAULT_COUNTRY ?? "CA").toUpperCase();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return Response.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const rl = checkRateLimit(`stripe:connect:onboard:${userId}`, { windowMs: 60_000, max: 8 });
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many onboarding attempts. Try again in a minute." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      stripeAccountId: true,
      _count: { select: { shortTermListings: true } },
    },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const isHostish =
    user.role === "HOST" || user.role === "ADMIN" || user._count.shortTermListings > 0;
  const isMortgageExpert =
    user.role === "MORTGAGE_EXPERT" ||
    user.role === "MORTGAGE_BROKER";
  if (!isHostish && !isMortgageExpert) {
    return Response.json(
      { error: "Only hosts or mortgage experts can connect a Stripe account for payouts." },
      { status: 403 }
    );
  }

  const base = stripeAppBaseUrl(request);
  const refreshUrl = isMortgageExpert
    ? `${base}/dashboard/expert/billing?stripe_connect=refresh`
    : `${base}/dashboard/host/payouts?stripe_connect=refresh`;
  const returnUrl = isMortgageExpert
    ? `${base}/dashboard/expert/billing?connected=1`
    : `${base}/dashboard/host/payouts?connected=1`;

  let accountId = user.stripeAccountId;

  try {
    void recordPlatformEvent({
      eventType: "stripe_connect_onboard_started",
      sourceModule: "stripe",
      entityType: "USER",
      entityId: user.id,
      payload: { hadAccount: Boolean(accountId) },
    }).catch(() => {});

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: DEFAULT_CONNECT_COUNTRY,
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { platformUserId: user.id },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeAccountId: accountId, stripeOnboardingComplete: false },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    void recordPlatformEvent({
      eventType: "stripe_connect_onboard_link_created",
      sourceModule: "stripe",
      entityType: "USER",
      entityId: user.id,
      payload: { accountId },
    }).catch(() => {});

    return Response.json({ url: link.url, accountId });
  } catch (e) {
    console.error("[stripe/connect/onboard]", e);
    const msg = e instanceof Error ? e.message : "Onboarding failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
