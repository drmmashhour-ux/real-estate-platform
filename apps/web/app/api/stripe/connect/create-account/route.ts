/**
 * POST /api/stripe/connect/create-account — Create Stripe Express connected account (API only); save stripeAccountId, onboarding incomplete.
 */

import type { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { ensureHostExpressAccount } from "@/lib/stripe/hostConnectExpress";

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

  const rl = checkRateLimit(`stripe:connect:create-account:${userId}`, { windowMs: 60_000, max: 10 });
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  const result = await ensureHostExpressAccount(stripe, userId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ accountId: result.accountId, created: result.created });
}
