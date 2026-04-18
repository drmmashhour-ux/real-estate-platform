import { prisma } from "@/lib/db";

/**
 * True if an autopilot row already exists for this target within the window (duplicate suppression).
 */
export async function hasRecentCampaignCandidate(input: {
  campaignKind: string;
  targetType: string;
  targetId: string;
  since: Date;
}): Promise<boolean> {
  const row = await prisma.growthAutopilotCampaignCandidate.findFirst({
    where: {
      campaignKind: input.campaignKind,
      targetType: input.targetType,
      targetId: input.targetId,
      createdAt: { gte: input.since },
    },
    select: { id: true },
  });
  return !!row;
}
