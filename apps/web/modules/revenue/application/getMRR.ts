import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import type { RevenueMRRResult } from "../domain/revenueTypes";

const PAYING: SubscriptionStatus[] = [
  SubscriptionStatus.trialing,
  SubscriptionStatus.active,
  SubscriptionStatus.past_due,
];

/**
 * Monthly recurring revenue from workspace subscriptions with known `mrrCents` (Stripe-derived).
 * Rows without `mrrCents` do not contribute to the sum but are counted in `subscriptionsMissingMrrCount`.
 */
export async function getMRR(db: PrismaClient): Promise<RevenueMRRResult> {
  const rows = await db.subscription.findMany({
    where: { status: { in: PAYING } },
    select: { mrrCents: true },
  });

  const activeSubscriptionCount = rows.length;
  let sumCents = 0;
  let subscriptionsMissingMrrCount = 0;
  for (const r of rows) {
    if (r.mrrCents == null) {
      subscriptionsMissingMrrCount += 1;
    } else {
      sumCents += r.mrrCents;
    }
  }

  if (activeSubscriptionCount === 0) {
    return { mrr: null, activeSubscriptionCount: 0, subscriptionsMissingMrrCount: 0 };
  }

  if (sumCents === 0 && subscriptionsMissingMrrCount > 0) {
    return {
      mrr: null,
      activeSubscriptionCount,
      subscriptionsMissingMrrCount,
    };
  }

  return {
    mrr: Math.round(sumCents) / 100,
    activeSubscriptionCount,
    subscriptionsMissingMrrCount,
  };
}
