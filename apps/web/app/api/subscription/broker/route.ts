import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import {
  countBrokerMarketplacePurchasesThisMonth,
  getBrokerEntitlementsForUser,
} from "@/modules/subscription/application/getBrokerEntitlements";

export const dynamic = "force-dynamic";

/** GET /api/subscription/broker — current broker plan + usage (brokers only). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== "BROKER" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Broker access required" }, { status: 403 });
  }

  const ent = await getBrokerEntitlementsForUser(prisma, userId);
  const used = await countBrokerMarketplacePurchasesThisMonth(prisma, userId);
  const sub = await prisma.brokerLecipmSubscription.findUnique({ where: { userId } });

  return NextResponse.json({
    plan: ent.plan,
    entitlements: ent,
    marketplacePurchasesThisMonth: used,
    stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
    subscriptionStatus: sub?.status ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
  });
}
