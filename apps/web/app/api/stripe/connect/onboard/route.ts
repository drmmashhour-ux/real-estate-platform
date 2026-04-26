/**
 * POST /api/stripe/connect/onboard — Legacy single-step onboarding.
 * Hosts: prefer POST /create-account then /create-account-link + /dashboard/stripe/success.
 * Mortgage experts: still use this route (custom return URLs).
 */

import { NextRequest } from "next/server";
import { monolithPrisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { recordPlatformEvent } from "@/lib/observability";
import {
  createHostAccountOnboardingLink,
  ensureHostExpressAccount,
} from "@/lib/stripe/hostConnectExpress";

export const dynamic = "force-dynamic";

const DEFAULT_CONNECT_COUNTRY = (process.env.STRIPE_CONNECT_DEFAULT_COUNTRY ?? "CA").toUpperCase();

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

  const user = await monolithPrisma.user.findUnique({
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
    user.role === "MORTGAGE_EXPERT" || user.role === "MORTGAGE_BROKER";
  if (!isHostish && !isMortgageExpert) {
    return Response.json(
      { error: "Only hosts or mortgage experts can connect a Stripe account for payouts." },
      { status: 403 }
    );
  }

  const base = stripeAppBaseUrl(request);

  try {
    void recordPlatformEvent({
      eventType: "stripe_connect_onboard_started",
      sourceModule: "stripe",
      entityType: "USER",
      entityId: user.id,
      payload: { hadAccount: Boolean(user.stripeAccountId), flow: isMortgageExpert ? "expert" : "host" },
    }).catch(() => {});

    if (isMortgageExpert) {
      const refreshUrl = `${base}/dashboard/expert/billing?stripe_connect=refresh`;
      const returnUrl = `${base}/dashboard/expert/billing?connected=1`;

      let accountId = user.stripeAccountId;
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
        await monolithPrisma.user.update({
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
        payload: { accountId, flow: "mortgage_expert" },
      }).catch(() => {});

      return Response.json({ url: link.url, accountId });
    }

    if (isHostish) {
      const ensured = await ensureHostExpressAccount(stripe, user.id);
      if (!ensured.ok) {
        return Response.json({ error: ensured.error }, { status: ensured.status });
      }
      const link = await createHostAccountOnboardingLink(stripe, ensured.accountId, base);
      if (!link.ok) {
        return Response.json({ error: link.error }, { status: link.status });
      }
      void recordPlatformEvent({
        eventType: "stripe_connect_onboard_link_created",
        sourceModule: "stripe",
        entityType: "USER",
        entityId: user.id,
        payload: { accountId: ensured.accountId, flow: "host_unified_onboard" },
      }).catch(() => {});
      return Response.json({ url: link.url, accountId: ensured.accountId });
    }

    return Response.json({ error: "Not allowed" }, { status: 403 });
  } catch (e) {
    console.error("[stripe/connect/onboard]", e);
    const msg = e instanceof Error ? e.message : "Onboarding failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
