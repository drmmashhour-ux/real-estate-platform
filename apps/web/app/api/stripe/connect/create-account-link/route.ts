/**
 * POST /api/stripe/connect/create-account-link — Stripe Account Link for Express onboarding (refresh → /dashboard/stripe/refresh, return → /dashboard/stripe/success).
 */

import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createHostAccountOnboardingLink, isBnhubHostConnectEligible } from "@/lib/stripe/hostConnectExpress";
import { recordPlatformEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

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

  const rl = checkRateLimit(`stripe:connect:create-link:${userId}`, { windowMs: 60_000, max: 12 });
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many link requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeAccountId: true,
      role: true,
      _count: { select: { shortTermListings: true } },
    },
  });
  if (!user?.stripeAccountId?.trim()) {
    return Response.json(
      { error: "No connected account yet. Call POST /api/stripe/connect/create-account first." },
      { status: 400 }
    );
  }
  // Web session has no Supabase host id here; BNHUB listing count is not applied (use mobile Connect API for full eligibility).
  if (!isBnhubHostConnectEligible(user.role, user._count.shortTermListings, 0)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const base = stripeAppBaseUrl(request);
  const link = await createHostAccountOnboardingLink(stripe, user.stripeAccountId.trim(), base);
  if (!link.ok) {
    return Response.json({ error: link.error }, { status: link.status });
  }

  void recordPlatformEvent({
    eventType: "stripe_connect_onboard_link_created",
    sourceModule: "stripe",
    entityType: "USER",
    entityId: userId,
    payload: { accountId: user.stripeAccountId },
  }).catch(() => {});

  return Response.json({ url: link.url });
}
