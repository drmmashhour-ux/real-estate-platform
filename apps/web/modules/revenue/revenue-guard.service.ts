/**
 * Soft revenue guard — never replaces Stripe; optional checkout soft-block when explicitly enabled.
 */

import { prisma } from "@/lib/db";
import {
  getRevenueEnforcementDevBypassUserIds,
  isRevenueEnforcementBlockCheckoutEnabled,
  isRevenueEnforcementV1Enabled,
} from "@/modules/revenue/revenue-enforcement-flags";
import { recordBlockedAccess } from "@/modules/revenue/revenue-monitoring.service";

export type RevenueGuardFeature = "lead_unlock" | "contact_reveal" | "premium_insight";

export type RevenueGuardResult = {
  allowed: boolean;
  reason?: "no_subscription" | "limit_reached" | "not_paid" | "ok";
};

async function userHasActiveSubscription(userId: string): Promise<boolean> {
  const row = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["trialing", "active"] },
    },
    select: { id: true },
  });
  return row != null;
}

/**
 * V1: when enforcement is off, always allow.
 * When on: dev bypass or active workspace subscription → allow with reason ok.
 * Otherwise reason `not_paid`; `allowed` stays true unless `REVENUE_ENFORCEMENT_BLOCK_CHECKOUT` is on
 * (then lead_unlock/contact_reveal may be soft-blocked at checkout).
 */
export async function canAccessRevenueFeature(input: {
  userId: string;
  feature: RevenueGuardFeature;
}): Promise<RevenueGuardResult> {
  if (!isRevenueEnforcementV1Enabled()) {
    return { allowed: true, reason: "ok" };
  }

  const bypass = getRevenueEnforcementDevBypassUserIds();
  if (bypass.has(input.userId)) {
    return { allowed: true, reason: "ok" };
  }

  const subscribed = await userHasActiveSubscription(input.userId);
  if (subscribed) {
    return { allowed: true, reason: "ok" };
  }

  const block = isRevenueEnforcementBlockCheckoutEnabled();
  const monetizedFeatures: RevenueGuardFeature[] = ["lead_unlock", "contact_reveal", "premium_insight"];
  const shouldEvaluateBlock = monetizedFeatures.includes(input.feature);

  if (shouldEvaluateBlock && block) {
    recordBlockedAccess("not_paid");
    return { allowed: false, reason: "not_paid" };
  }

  return { allowed: true, reason: "not_paid" };
}
