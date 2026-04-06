import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getConnectAccountStatus } from "@/lib/stripe/connect/service";

export async function upsertHostStripeAccountSnapshot(
  stripe: Stripe,
  hostUserId: string,
  accountId: string
): Promise<void> {
  const status = await getConnectAccountStatus(accountId, stripe);
  const acct = await stripe.accounts.retrieve(accountId);
  const req = acct.requirements;
  const raw = {
    currently_due: req?.currently_due ?? [],
    eventually_due: req?.eventually_due ?? [],
    past_due: req?.past_due ?? [],
    disabled_reason: req?.disabled_reason ?? null,
    current_deadline: req?.current_deadline ?? null,
  };
  await prisma.hostStripeAccountSnapshot.upsert({
    where: { hostUserId },
    create: {
      hostUserId,
      stripeAccountId: accountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      onboardingComplete: status.onboardingComplete,
      rawRequirementsJson: raw as object,
    },
    update: {
      stripeAccountId: accountId,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      onboardingComplete: status.onboardingComplete,
      rawRequirementsJson: raw as object,
    },
  });
}

/** Refreshes Connect snapshot from Stripe before payout eligibility / transfers (no-op if Stripe off or no account). */
export async function refreshHostStripeAccountSnapshotForHost(hostUserId: string): Promise<void> {
  if (!isStripeConfigured()) return;
  const stripe = getStripe();
  if (!stripe) return;
  const user = await prisma.user.findUnique({
    where: { id: hostUserId },
    select: { stripeAccountId: true },
  });
  const accountId = user?.stripeAccountId?.trim();
  if (!accountId) return;
  try {
    await upsertHostStripeAccountSnapshot(stripe, hostUserId, accountId);
  } catch (e) {
    logWarn("[stripe] HostStripeAccountSnapshot refresh failed", {
      hostUserId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
