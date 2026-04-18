import { NextResponse } from "next/server";
import { z } from "zod";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";
import { createWorkspaceCheckoutSession } from "@/modules/billing/createWorkspaceCheckoutSession";
import { engineFlags } from "@/config/feature-flags";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  planKey: z.enum(["pro", "growth"]),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * POST /api/stripe/checkout/subscription — host/workspace subscription (delegates to workspace checkout session).
 * Requires Stripe price envs — see createWorkspaceCheckoutSession.
 */
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  if (!engineFlags.subscriptionsV1) {
    return NextResponse.json({ error: "FEATURE_SUBSCRIPTIONS_V1 disabled" }, { status: 403 });
  }

  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

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

  const { planKey, successUrl, cancelUrl } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const lookupKey =
    planKey === "growth"
      ? process.env.STRIPE_LOOKUP_LECIPM_HOST_GROWTH?.trim()
      : process.env.STRIPE_LOOKUP_LECIPM_HOST_PRO?.trim();

  const planCode = planKey === "growth" ? "host_growth" : "host_pro";

  const session = await createWorkspaceCheckoutSession({
    userId,
    userEmail: user.email,
    successUrl,
    cancelUrl,
    ...(lookupKey ? { lookupKey } : {}),
    planCode,
    extraSessionMetadata: { hostPlanKey: planKey },
  });

  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: 503 });
  }

  return NextResponse.json({ url: session.url, sessionId: session.sessionId });
}
