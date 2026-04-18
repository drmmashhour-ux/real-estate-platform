import { prisma } from "@/lib/db";

export async function logFounderDecision(input: {
  userId: string;
  title: string;
  summary: string;
  linkedBriefingId?: string;
  linkedInsightType?: string;
}) {
  return prisma.founderDecisionLog.create({
    data: {
      title: input.title,
      summary: input.summary,
      linkedBriefingId: input.linkedBriefingId,
      linkedInsightType: input.linkedInsightType,
      decidedByUserId: input.userId,
    },
  });
}
