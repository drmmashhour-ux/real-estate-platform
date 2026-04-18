/**
 * Lead listing for Growth Machine — scoped queries on real `Lead` rows.
 */
import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listGrowthLeadsForUser(opts: {
  userId: string;
  role: PlatformRole;
  take?: number;
}) {
  const take = opts.take ?? 80;
  const { userId, role } = opts;

  if (role === PlatformRole.ADMIN || role === PlatformRole.ACCOUNTANT) {
    return prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        name: true,
        email: true,
        pipelineStatus: true,
        score: true,
        source: true,
        campaign: true,
        leadType: true,
        createdAt: true,
      },
    });
  }

  if (role === PlatformRole.BROKER) {
    return prisma.lead.findMany({
      where: { introducedByBrokerId: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        name: true,
        email: true,
        pipelineStatus: true,
        score: true,
        source: true,
        campaign: true,
        leadType: true,
        createdAt: true,
      },
    });
  }

  if (role === PlatformRole.HOST) {
    const listings = await prisma.fsboListing.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const ids = listings.map((l) => l.id);
    if (ids.length === 0) return [];
    return prisma.lead.findMany({
      where: { fsboListingId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        name: true,
        email: true,
        pipelineStatus: true,
        score: true,
        source: true,
        campaign: true,
        leadType: true,
        createdAt: true,
      },
    });
  }

  return prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      pipelineStatus: true,
      score: true,
      source: true,
      campaign: true,
      leadType: true,
      createdAt: true,
    },
  });
}
