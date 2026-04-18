import { prisma } from "@/lib/db";
import { GROWTH_V2 } from "./growth-v2.constants";

/**
 * Real-signal audience keys for campaign candidates (IDs remain server-only).
 */
export async function buildStaleBrokerLeadAudienceSample(limit = 60): Promise<
  { leadId: string; brokerHint: string | null; userId: string | null; score: number }[]
> {
  const since = new Date(Date.now() - 10 * 86400000);
  const leads = await prisma.lead.findMany({
    where: {
      pipelineStatus: { notIn: ["won", "lost", "closed"] },
      optedOutOfFollowUp: false,
      score: { gte: GROWTH_V2.MIN_LEAD_SCORE_FOR_BROKER_CAMPAIGN },
      OR: [{ lastFollowUpAt: null }, { lastFollowUpAt: { lt: since } }],
    },
    take: limit,
    select: { id: true, email: true, userId: true, score: true },
    orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
  });
  return leads.map((l) => ({
    leadId: l.id,
    brokerHint: null,
    userId: l.userId,
    score: l.score,
  }));
}
