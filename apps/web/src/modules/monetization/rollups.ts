import { prisma } from "@/lib/db";

const MS_90 = 90 * 24 * 60 * 60 * 1000;

export type MonetizationRollup = {
  revenueCents90d: number;
  paidPayments90d: number;
  revenuePerListingApprox: number | null;
  revenuePerUserApprox: number | null;
  brokerAttributedCents90d: number;
};

/**
 * High-level monetization KPIs for the Monopoly dashboard (approximate; excludes non-Stripe cashflows).
 */
export async function getMonetizationRollup(since = new Date(Date.now() - MS_90)): Promise<MonetizationRollup> {
  const [paid, withListing, brokerCommissions] = await Promise.all([
    prisma.platformPayment.aggregate({
      where: { status: "paid", createdAt: { gte: since } },
      _sum: { amountCents: true },
      _count: { id: true },
    }),
    prisma.platformPayment.groupBy({
      by: ["listingId"],
      where: { status: "paid", listingId: { not: null }, createdAt: { gte: since } },
      _sum: { amountCents: true },
    }),
    prisma.brokerCommission.aggregate({
      where: { createdAt: { gte: since }, brokerId: { not: null } },
      _sum: { brokerAmountCents: true },
    }),
  ]);

  const revenueCents90d = paid._sum.amountCents ?? 0;
  const paidPayments90d = paid._count.id;
  const listingBuckets = withListing.filter((r) => r.listingId);
  const sumListingAttributed = listingBuckets.reduce((a, b) => a + (b._sum.amountCents ?? 0), 0);
  const revenuePerListingApprox =
    listingBuckets.length > 0 ? Math.round(sumListingAttributed / listingBuckets.length) : null;

  const distinctUsers = await prisma.platformPayment.findMany({
    where: { status: "paid", createdAt: { gte: since } },
    distinct: ["userId"],
    select: { userId: true },
  });
  const nUsers = distinctUsers.length;
  const revenuePerUserApprox = nUsers > 0 ? Math.round(revenueCents90d / nUsers) : null;

  return {
    revenueCents90d,
    paidPayments90d,
    revenuePerListingApprox,
    revenuePerUserApprox,
    brokerAttributedCents90d: brokerCommissions._sum.brokerAmountCents ?? 0,
  };
}
