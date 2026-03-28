import { prisma } from "@/lib/db";

export const BNHUB_BADGE_TOP_HOST = "top_host";
export const BNHUB_BADGE_FAST_RESPONDER = "fast_responder";
export const BNHUB_BADGE_RELIABLE_HOST = "reliable_host";

const MANAGED_BADGE_TYPES = [
  BNHUB_BADGE_TOP_HOST,
  BNHUB_BADGE_FAST_RESPONDER,
  BNHUB_BADGE_RELIABLE_HOST,
] as const;

export type HostPerformanceBadgeInput = {
  score: number;
  responseRate: number;
  cancellationRate: number;
};

/**
 * Assigns trust badges from host performance metrics. Removes stale managed badges first.
 */
export async function syncHostBadgesFromPerformance(
  hostId: string,
  perf: HostPerformanceBadgeInput
): Promise<string[]> {
  const next = new Set<string>();
  if (perf.score > 90) next.add(BNHUB_BADGE_TOP_HOST);
  if (perf.responseRate > 0.9) next.add(BNHUB_BADGE_FAST_RESPONDER);
  if (perf.cancellationRate < 0.05) next.add(BNHUB_BADGE_RELIABLE_HOST);

  await prisma.$transaction([
    prisma.hostBadge.deleteMany({
      where: { hostId, badgeType: { in: [...MANAGED_BADGE_TYPES] } },
    }),
    ...[...next].map((badgeType) =>
      prisma.hostBadge.create({
        data: { hostId, badgeType },
      })
    ),
  ]);

  return [...next];
}

export async function getHostBadges(hostId: string) {
  return prisma.hostBadge.findMany({
    where: { hostId },
    orderBy: { assignedAt: "desc" },
  });
}
