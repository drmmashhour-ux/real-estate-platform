/**
 * GET /api/stripe/connect/status — Sync Connect onboarding state from Stripe for the signed-in user.
 */

import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { isStripeConfigured } from "@/lib/stripe";
import { recordPlatformEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export async function GET() {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });
  if (!user?.stripeAccountId) {
    return Response.json({
      connected: false,
      onboardingComplete: false,
      chargesEnabled: false,
    });
  }

  try {
    const acct = await stripe.accounts.retrieve(user.stripeAccountId);
    const chargesEnabled = Boolean(acct.charges_enabled);
    const detailsSubmitted = Boolean(acct.details_submitted);
    const onboardingComplete = chargesEnabled && detailsSubmitted;

    if (onboardingComplete !== user.stripeOnboardingComplete) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeOnboardingComplete: onboardingComplete },
      });
      if (onboardingComplete) {
        void recordPlatformEvent({
          eventType: "stripe_connect_onboarding_completed",
          sourceModule: "stripe",
          entityType: "USER",
          entityId: userId,
        }).catch(() => {});
      }
    }

    return Response.json({
      connected: true,
      onboardingComplete,
      chargesEnabled,
      detailsSubmitted,
      accountId: user.stripeAccountId,
    });
  } catch (e) {
    console.error("[stripe/connect/status]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load Stripe account" },
      { status: 400 }
    );
  }
}
