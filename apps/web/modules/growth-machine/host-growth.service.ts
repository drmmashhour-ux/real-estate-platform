/**
 * BNHub host growth — read-only snapshots + copy suggestions (no auto messaging).
 */
import { prisma } from "@/lib/db";
import { generateGrowthContentDrafts } from "./growth-content.service";

export async function getHostGrowthSnapshot(userId: string) {
  const host = await prisma.bnhubHost.findUnique({
    where: { userId },
    include: { listings: { take: 10, orderBy: { createdAt: "desc" } } },
  });
  if (!host) return { kind: "no_host_profile" as const };

  const recruitmentCopy = generateGrowthContentDrafts({
    audience: "host",
    city: host.location?.trim() || "Montréal",
    campaignGoal: "conversion",
    tone: "bnb",
  });

  return {
    kind: "host" as const,
    hostStatus: host.status,
    listingCount: host.listings.length,
    recruitmentCopyHints: recruitmentCopy.socialCaptions.slice(0, 2),
  };
}
