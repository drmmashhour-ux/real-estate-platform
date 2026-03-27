import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import type { RevenueChurnResult } from "../domain/revenueTypes";

const PAYING: SubscriptionStatus[] = [
  SubscriptionStatus.trialing,
  SubscriptionStatus.active,
  SubscriptionStatus.past_due,
];

export type ChurnWindow = { start: Date; end: Date };

/**
 * Logo churn approximation: subscriptions marked canceled within the window vs current paying pool + those churned in window.
 * Deterministic from `subscriptions.status` and `updated_at`.
 */
export async function getChurnRate(db: PrismaClient, window: ChurnWindow): Promise<RevenueChurnResult> {
  const { start, end } = window;

  const [canceledInWindowCount, activePayingCount] = await Promise.all([
    db.subscription.count({
      where: {
        status: SubscriptionStatus.canceled,
        updatedAt: { gte: start, lte: end },
      },
    }),
    db.subscription.count({
      where: { status: { in: PAYING } },
    }),
  ]);

  const denom = activePayingCount + canceledInWindowCount;
  const churnRate = denom > 0 ? canceledInWindowCount / denom : null;

  return {
    churnRate,
    canceledInWindowCount,
    activePayingCount,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
  };
}
