import { stripe } from "@/lib/stripe";
import { authPrisma, monolithPrisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/middleware";

import { requireCheckoutRailsOpen } from "@/lib/payment-readiness/route-guards";

export const dynamic = "force-dynamic";

const DEFAULT_COUNTRY = (process.env.STRIPE_CONNECT_DEFAULT_COUNTRY ?? "CA").toUpperCase();

/**
 * POST /api/stripe/connect — Create or reuse Stripe Express Connect account + Account Link (onboarding).
 * Persists `User.stripeAccountId` (already on schema). For BNHub-guarded flows see `/api/stripe/connect/create-account`.
 */
export async function POST(_req: Request) {
  const railBlock = requireCheckoutRailsOpen();
  if (railBlock) return railBlock;

  if (!stripe) {
    return Response.json(
      { error: "Stripe is not configured (set STRIPE_SECRET_KEY or disable demo mode)" },
      { status: 503 },
    );
  }

  const user = requireAuth(_req);
  if (!user || typeof user !== "object" || !("userId" in user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (user as { userId: string }).userId;

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim() || "http://localhost:3001";

  const dbUser = await authPrisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, email: true },
  });
  if (!dbUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  let accountId = dbUser.stripeAccountId?.trim() ?? "";
  if (!accountId) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        country: DEFAULT_COUNTRY,
        email: dbUser.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { platformUserId: userId, source: "api_stripe_connect_root" },
      });
      accountId = account.id;
      await monolithPrisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: accountId, stripeOnboardingComplete: false },
      });
    } catch (e) {
      console.error("stripe.accounts.create", e);
      return Response.json({ error: "Stripe error", detail: String(e) }, { status: 502 });
    }
  }

  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/dashboard`,
      return_url: `${base}/dashboard`,
      type: "account_onboarding",
    });
    return Response.json({ url: link.url });
  } catch (e) {
    console.error("stripe.accountLinks.create", e);
    return Response.json({ error: "Stripe error", detail: String(e) }, { status: 502 });
  }
}
