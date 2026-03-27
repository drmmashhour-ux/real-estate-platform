import type { PrismaClient } from "@prisma/client";
import {
  entitlementsForPlan,
  normalizeBrokerPlanSlug,
  type BrokerEntitlements,
  type BrokerPlanSlug,
} from "../domain/brokerPlans";

export async function getBrokerEntitlementsForUser(
  db: PrismaClient,
  userId: string
): Promise<BrokerEntitlements> {
  const row = await db.brokerLecipmSubscription.findUnique({
    where: { userId },
  });
  if (!row) return entitlementsForPlan("free");
  const active = ["active", "trialing", "past_due"].includes(row.status);
  if (!active) return entitlementsForPlan("free");
  return entitlementsForPlan(normalizeBrokerPlanSlug(row.planSlug) as BrokerPlanSlug);
}

export async function countBrokerMarketplacePurchasesThisMonth(
  db: PrismaClient,
  buyerUserId: string
): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return db.leadMarketplaceListing.count({
    where: {
      buyerUserId,
      status: "sold",
      purchasedAt: { gte: start },
    },
  });
}
