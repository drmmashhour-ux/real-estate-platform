import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const DAY = 24 * 60 * 60 * 1000;

export type NetworkEffectMetrics = {
  listingsTotal: number;
  listingsPublished: number;
  listingsGrowth30d: number;
  usersTotal: number;
  usersGrowth30d: number;
  leads30d: number;
  leadsPrev30d: number;
  leadGrowthPercent: number | null;
};

export async function getNetworkEffectMetrics(now = new Date()): Promise<NetworkEffectMetrics> {
  const t30 = new Date(now.getTime() - 30 * DAY);
  const t60 = new Date(now.getTime() - 60 * DAY);

  const [
    listingsTotal,
    listingsPublished,
    listingsGrowth30d,
    usersTotal,
    usersGrowth30d,
    leads30d,
    leadsPrev30d,
  ] = await Promise.all([
    prisma.shortTermListing.count(),
    prisma.shortTermListing.count({ where: { listingStatus: ListingStatus.PUBLISHED } }),
    prisma.shortTermListing.count({ where: { createdAt: { gte: t30 } } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: t30 } } }),
    prisma.lead.count({ where: { createdAt: { gte: t30 } } }),
    prisma.lead.count({ where: { createdAt: { gte: t60, lt: t30 } } }),
  ]);

  let leadGrowthPercent: number | null = null;
  if (leadsPrev30d > 0) {
    leadGrowthPercent = Math.round(((leads30d - leadsPrev30d) / leadsPrev30d) * 1000) / 10;
  } else if (leads30d > 0) {
    leadGrowthPercent = 100;
  }

  return {
    listingsTotal,
    listingsPublished,
    listingsGrowth30d,
    usersTotal,
    usersGrowth30d,
    leads30d,
    leadsPrev30d,
    leadGrowthPercent,
  };
}
