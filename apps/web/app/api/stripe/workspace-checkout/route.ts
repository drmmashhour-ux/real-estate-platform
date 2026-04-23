/**
 * POST /api/stripe/workspace-checkout — Subscription Checkout with explicit planCode + priceId (+ optional workspaceId).
 * Uses real session auth and LECIPM webhook metadata (see createWorkspaceCheckoutSession).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { isStripeConfigured } from "@/lib/stripe";
import { createWorkspaceCheckoutSession } from "@/modules/billing/createWorkspaceCheckoutSession";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  planCode: z.string().min(1),
  /** Optional; falls back to STRIPE_PRICE_LECIPM_PRO when omitted. */
  priceId: z.string().min(1).optional(),
  /** Optional; resolves price via Stripe Price lookup_key. */
  lookupKey: z.string().min(1).optional(),
  workspaceId: z.string().uuid().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = checkRateLimit(`stripe:workspace-checkout:ip:${ip}`, { windowMs: 60 * 1000, max: 40 });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout requests from this network. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(ipLimit) }
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments are not configured. Please try again later." }, { status: 503 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userLimit = checkRateLimit(`stripe:workspace-checkout:${userId}`, { windowMs: 60 * 1000, max: 20 });
  if (!userLimit.allowed) {
    return NextResponse.json(
      { error: "Too many checkout requests. Try again in a minute." },
      { status: 429, headers: getRateLimitHeaders(userLimit) }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "User email required for subscription checkout" }, { status: 400 });
  }

  const result = await createWorkspaceCheckoutSession({
    userId,
    userEmail: user.email,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
    priceId: body.priceId,
    lookupKey: body.lookupKey,
    planCode: body.planCode,
    workspaceId: body.workspaceId,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    url: result.url,
    sessionId: result.sessionId,
  });
}
