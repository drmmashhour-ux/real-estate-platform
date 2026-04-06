/**
 * GET /api/stripe/connect/status — Sync onboarding from Stripe + persist requirements snapshot for host dashboard.
 */

import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { syncHostOnboardingCompleteFromStripe } from "@/lib/stripe/hostConnectExpress";
import { upsertHostStripeAccountSnapshot } from "@/lib/stripe/connect/persist-snapshot";

export const dynamic = "force-dynamic";

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
  if (!user?.stripeAccountId?.trim()) {
    return Response.json({
      connected: false,
      onboardingComplete: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      missingRequirements: [] as string[],
      disabledReason: null as string | null,
    });
  }

  const accountId = user.stripeAccountId.trim();

  try {
    const { detailsSubmitted, chargesEnabled, payoutsEnabled } = await syncHostOnboardingCompleteFromStripe(
      stripe,
      userId,
      accountId
    );

    await upsertHostStripeAccountSnapshot(stripe, userId, accountId);

    const snap = await prisma.hostStripeAccountSnapshot.findUnique({
      where: { hostUserId: userId },
      select: { rawRequirementsJson: true, onboardingComplete: true },
    });

    const raw = snap?.rawRequirementsJson;
    const reqObj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const currentlyDue = Array.isArray(reqObj.currently_due)
      ? (reqObj.currently_due as string[])
      : ([] as string[]);
    const pastDue = Array.isArray(reqObj.past_due) ? (reqObj.past_due as string[]) : [];
    const disabledReason =
      typeof reqObj.disabled_reason === "string" ? reqObj.disabled_reason : null;

    const fresh = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeOnboardingComplete: true },
    });

    return Response.json({
      connected: true,
      onboardingComplete: Boolean(fresh?.stripeOnboardingComplete ?? snap?.onboardingComplete),
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
      accountId,
      missingRequirements: [...new Set([...currentlyDue, ...pastDue])],
      disabledReason,
    });
  } catch (e) {
    console.error("[stripe/connect/status]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Failed to load Stripe account" },
      { status: 400 }
    );
  }
}
