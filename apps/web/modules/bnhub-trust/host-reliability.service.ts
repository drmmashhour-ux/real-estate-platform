import { prisma } from "@/lib/db";

export async function getHostReliability(hostUserId: string): Promise<{
  qualityScore: number | null;
  isSuperHost: boolean;
  cancellationRate: number | null;
  avgResponseMinutes: number | null;
} | null> {
  const hq = await prisma.hostQuality.findUnique({
    where: { userId: hostUserId },
    select: {
      qualityScore: true,
      isSuperHost: true,
      cancellationRate: true,
      avgResponseMinutes: true,
    },
  });
  if (!hq) return null;
  return {
    qualityScore: hq.qualityScore,
    isSuperHost: hq.isSuperHost,
    cancellationRate: hq.cancellationRate,
    avgResponseMinutes: hq.avgResponseMinutes,
  };
}
