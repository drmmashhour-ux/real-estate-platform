import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";
import type { RevenueLTVResult } from "../domain/revenueTypes";
import { getMRR } from "./getMRR";

const PAYING: SubscriptionStatus[] = [
  SubscriptionStatus.trialing,
  SubscriptionStatus.active,
  SubscriptionStatus.past_due,
];

function monthsBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return ms / (1000 * 60 * 60 * 24 * (365.25 / 12));
}

/**
 * LTV = ARPU × average subscriber lifetime (months), using canceled workspace subscriptions only for lifespan.
 * Returns nulls when MRR or canceled cohort is empty (no invented numbers).
 */
export async function getLTV(db: PrismaClient): Promise<RevenueLTVResult> {
  const mrrResult = await getMRR(db);
  const activePaying = await db.subscription.count({
    where: { status: { in: PAYING } },
  });

  const arpu =
    mrrResult.mrr != null && activePaying > 0 ? mrrResult.mrr / activePaying : null;

  const canceled = await db.subscription.findMany({
    where: { status: SubscriptionStatus.canceled },
    select: { createdAt: true, updatedAt: true },
  });

  if (canceled.length === 0) {
    return {
      ltv: null,
      arpu,
      averageSubscriberLifetimeMonths: null,
      canceledSampleCount: 0,
    };
  }

  let totalMonths = 0;
  for (const c of canceled) {
    totalMonths += monthsBetween(c.createdAt, c.updatedAt);
  }
  const averageSubscriberLifetimeMonths = totalMonths / canceled.length;

  const ltv = arpu != null ? arpu * averageSubscriberLifetimeMonths : null;

  return {
    ltv,
    arpu,
    averageSubscriberLifetimeMonths,
    canceledSampleCount: canceled.length,
  };
}
