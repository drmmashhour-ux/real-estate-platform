/**
 * POST /api/stripe/subscription-by-lookup
 * Creates a Stripe Checkout Session (mode: subscription) from a Product Price **lookup_key**.
 * PCI: card entry only on Stripe-hosted Checkout.
 *
 * Configure in Dashboard: Product → Price → lookup_key (e.g. `starter_monthly`).
 * Env: STRIPE_SUBSCRIPTION_LOOKUP_KEYS_ALLOWLIST=comma,separated,keys
 */
import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { stripeAppBaseUrl } from "@/lib/stripe/app-base-url";

export const dynamic = "force-dynamic";

const PAYMENT_TYPE = "subscription_by_lookup_key";

function parseAllowlist(): Set<string> {
  const raw = process.env.STRIPE_SUBSCRIPTION_LOOKUP_KEYS_ALLOWLIST?.trim() ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const allow = parseAllowlist();
  if (allow.size === 0) {
    return NextResponse.json(
      {
        error:
          "Set STRIPE_SUBSCRIPTION_LOOKUP_KEYS_ALLOWLIST in apps/web/.env (comma-separated Price lookup_keys).",
      },
      { status: 503 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const rl = checkRateLimit(`stripe:sub-lookup:${ip}`, { windowMs: 60_000, max: 20 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lookupKey = typeof body.lookup_key === "string" ? body.lookup_key.trim() : "";
  if (!lookupKey) {
    return NextResponse.json({ error: "lookup_key is required" }, { status: 400 });
  }
  if (!allow.has(lookupKey)) {
    return NextResponse.json({ error: "lookup_key is not allowed" }, { status: 400 });
  }

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const price = prices.data[0];
  if (!price) {
    return NextResponse.json(
      { error: `No active Price found for lookup_key: ${lookupKey}` },
      { status: 404 }
    );
  }

  const base = stripeAppBaseUrl(req);
  const successPath =
    typeof body.successPath === "string" && body.successPath.startsWith("/")
      ? body.successPath
      : "/stripe-subscribe-example?checkout=success";
  const cancelPath =
    typeof body.cancelPath === "string" && body.cancelPath.startsWith("/")
      ? body.cancelPath
      : "/stripe-subscribe-example?checkout=cancel";

  const userId = await getGuestId();
  let customerEmail: string | undefined;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    customerEmail = u?.email?.trim() || undefined;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${base}${successPath.startsWith("/") ? "" : "/"}${successPath}`,
    cancel_url: `${base}${cancelPath.startsWith("/") ? "" : "/"}${cancelPath}`,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    metadata: {
      paymentType: PAYMENT_TYPE,
      lookupKey,
      ...(userId ? { userId } : {}),
    },
    subscription_data: {
      metadata: {
        paymentType: PAYMENT_TYPE,
        lookupKey,
        ...(userId ? { userId } : {}),
      },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Checkout session missing redirect URL" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
