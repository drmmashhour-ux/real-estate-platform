/**
 * BNHub host Stripe Connect Express — create account + Account Links (API onboarding only).
 */

import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { logInfo } from "@/lib/logger";

const DEFAULT_COUNTRY = (process.env.STRIPE_CONNECT_DEFAULT_COUNTRY ?? "CA").toUpperCase();

/** BNHub Supabase `listings.host_user_id` counts toward host eligibility when Prisma short-term count is zero. */
export function isBnhubHostConnectEligible(
  role: string,
  shortTermListingCount: number,
  bnhubSupabaseListingCount = 0
): boolean {
  return (
    role === "HOST" ||
    role === "ADMIN" ||
    shortTermListingCount > 0 ||
    bnhubSupabaseListingCount > 0
  );
}

export async function getHostConnectUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      stripeAccountId: true,
      _count: { select: { shortTermListings: true } },
    },
  });
}

/**
 * Create Express connected account via API if missing; always sets stripeOnboardingComplete=false when creating.
 * Idempotent when stripeAccountId already set.
 */
export async function ensureHostExpressAccount(
  stripe: Stripe,
  userId: string,
  opts?: { bnhubSupabaseListingCount?: number }
): Promise<
  | { ok: true; accountId: string; created: boolean }
  | { ok: false; status: number; error: string }
> {
  const user = await getHostConnectUser(userId);
  if (!user) {
    return { ok: false, status: 404, error: "User not found" };
  }
  const bnhubN = opts?.bnhubSupabaseListingCount ?? 0;
  if (!isBnhubHostConnectEligible(user.role, user._count.shortTermListings, bnhubN)) {
    return {
      ok: false,
      status: 403,
      error: "Only hosts with listings (or HOST/ADMIN) can connect a Stripe payout account.",
    };
  }

  if (user.stripeAccountId?.trim()) {
    return { ok: true, accountId: user.stripeAccountId.trim(), created: false };
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: DEFAULT_COUNTRY,
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { platformUserId: user.id, source: "lecipm_connect_api" },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: account.id, stripeOnboardingComplete: false },
    });

    void recordPlatformEvent({
      eventType: "stripe_connect_account_created",
      sourceModule: "stripe",
      entityType: "USER",
      entityId: user.id,
      payload: { accountId: account.id },
    }).catch(() => {});

    return { ok: true, accountId: account.id, created: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create connected account";
    return { ok: false, status: 400, error: msg };
  }
}

export async function createHostAccountOnboardingLink(
  stripe: Stripe,
  accountId: string,
  baseUrl: string,
  paths?: { refreshPath?: string; returnPath?: string }
): Promise<{ ok: true; url: string } | { ok: false; status: number; error: string }> {
  const refreshPath = paths?.refreshPath ?? "/dashboard/stripe/refresh";
  const returnPath = paths?.returnPath ?? "/dashboard/stripe/success";
  const refreshUrl = `${baseUrl.replace(/\/$/, "")}${refreshPath}`;
  const returnUrl = `${baseUrl.replace(/\/$/, "")}${returnPath}`;

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return { ok: true, url: accountLink.url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create onboarding link";
    return { ok: false, status: 400, error: msg };
  }
}

/**
 * Sync `stripeOnboardingComplete` from Stripe: all of details_submitted, charges_enabled, payouts_enabled.
 */
export async function syncHostOnboardingCompleteFromStripe(
  stripe: Stripe,
  userId: string,
  stripeAccountId: string
): Promise<{
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  updated: boolean;
}> {
  const acct = await stripe.accounts.retrieve(stripeAccountId);
  const detailsSubmitted = Boolean(acct.details_submitted);
  const chargesEnabled = Boolean(acct.charges_enabled);
  const payoutsEnabled = Boolean(acct.payouts_enabled);

  logInfo("[payout] host stripe account readiness", {
    userId,
    details_submitted: acct.details_submitted,
    charges_enabled: acct.charges_enabled,
    payouts_enabled: acct.payouts_enabled,
  });

  const isFullyEnabled = detailsSubmitted && chargesEnabled && payoutsEnabled;

  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeOnboardingComplete: true },
  });

  if (isFullyEnabled) {
    if (row?.stripeOnboardingComplete) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeChargesEnabled: chargesEnabled,
          stripePayoutsEnabled: payoutsEnabled,
        },
      });
      return { detailsSubmitted, chargesEnabled, payoutsEnabled, updated: false };
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeOnboardingComplete: true,
        stripeChargesEnabled: chargesEnabled,
        stripePayoutsEnabled: payoutsEnabled,
      },
    });
    void recordPlatformEvent({
      eventType: "stripe_connect_onboarding_completed",
      sourceModule: "stripe",
      entityType: "USER",
      entityId: userId,
      payload: { via: "stripe_account_fully_enabled" },
    }).catch(() => {});
    return { detailsSubmitted, chargesEnabled, payoutsEnabled, updated: true };
  }

  if (row?.stripeOnboardingComplete) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeOnboardingComplete: false,
        stripeChargesEnabled: chargesEnabled,
        stripePayoutsEnabled: payoutsEnabled,
      },
    });
    return { detailsSubmitted, chargesEnabled, payoutsEnabled, updated: true };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeChargesEnabled: chargesEnabled,
      stripePayoutsEnabled: payoutsEnabled,
    },
  });

  return { detailsSubmitted, chargesEnabled, payoutsEnabled, updated: false };
}
