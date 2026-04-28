/**
 * POST /api/stripe/billing-portal
 * Authenticated user → Stripe Customer Portal (manage subscription / payment method).
 * Customer id comes from the synced workspace `Subscription` row, not from client-supplied session_id.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";
import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  returnUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ipLimit = checkRateLimit(`stripe:billing-portal:ip:${ip}`, { windowMs: 60_000, max: 30 });
  if (!ipLimit.allowed) {
    return Response.json(
      { error: "Too many requests from this network. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(ipLimit) }
    );
  }

  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  if (!isStripeConfigured()) {
    return Response.json({ error: "Payments are not configured." }, { status: 503 });
  }

  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  const userLimit = checkRateLimit(`stripe:billing-portal:${userId}`, { windowMs: 60_000, max: 15 });
  if (!userLimit.allowed) {
    return Response.json(
      { error: "Too many portal requests. Try again in a minute." },
      { status: 429, headers: getRateLimitHeaders(userLimit) }
    );
  }

  let json: unknown = {};
  try {
    const text = await req.text();
    if (text) json = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      stripeCustomerId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: { stripeCustomerId: true },
  });

  const customerId = sub?.stripeCustomerId?.trim();
  if (!customerId) {
    return Response.json(
      { error: "No Stripe billing profile yet. Complete a workspace subscription checkout first." },
      { status: 404 }
    );
  }

  const base = stripeAppBaseUrl(req);
  const returnUrl = parsed.data.returnUrl?.trim() || `${base}/dashboard`;

  const stripe = getStripe();
  if (!stripe) {
    return Response.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      ...(configuration ? { configuration } : {}),
    });
    const url = session.url;
    if (!url) {
      return Response.json({ error: "Stripe did not return a portal URL." }, { status: 502 });
    }
    return Response.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Portal session failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
