import { prisma } from "@/lib/db";
import { aggregateLeadIntelligence } from "@/src/core/intelligence/aggregation/aggregationEngine";
import type { LeadSelectionResult } from "@/src/modules/ai-selection-engine/domain/selection.types";
import { sortByScoreDesc, weightedScore } from "@/src/modules/ai-selection-engine/infrastructure/selectionRankingService";

export async function rankLeadsForUser(userId: string): Promise<LeadSelectionResult[]> {
  const leads = await prisma.lead.findMany({
    where: { OR: [{ introducedByBrokerId: userId }, { userId }] },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      highIntent: true,
      engagementScore: true,
      estimatedValue: true,
      dealValue: true,
      lecipmUrgencyScore: true,
      conversionProbability: true,
      pipelineStatus: true,
    },
  });

  const ranked = sortByScoreDesc(
    leads.map((l) => {
      const intent = l.highIntent ? 90 : Math.min(85, 40 + l.engagementScore * 0.8);
      const responseLikelihood = Math.round((l.conversionProbability ?? 0.4) * 100);
      const dealSize = Math.min(100, Math.round((l.dealValue ?? l.estimatedValue ?? 0) / 10000));
      const urgency = l.lecipmUrgencyScore ?? (l.pipelineStatus === "new" ? 55 : 45);

      const intelligence = aggregateLeadIntelligence({
        cacheKey: `selection:lead:${l.id}`,
        input: { engagementScore: intent, responseLikelihood, urgency, dealSize },
      });

      const score = weightedScore([
        { value: intent, weight: 0.3 },
        { value: responseLikelihood, weight: 0.25 },
        { value: dealSize, weight: 0.2 },
        { value: urgency, weight: 0.1 },
        { value: intelligence.scores.dealScore, weight: 0.15 },
      ]);

      return { l, intent, responseLikelihood, dealSize, urgency, score, intelligence };
    })
  ).slice(0, 10);

  return ranked.map((x) => ({
    id: x.l.id,
    type: "lead",
    leadId: x.l.id,
    leadName: x.l.name,
    score: x.score,
    confidence: x.intelligence.confidence,
    intentScore: x.intent,
    responseLikelihood: x.responseLikelihood,
    dealSize: x.dealSize,
    urgency: x.urgency,
    reasons: x.intelligence.explanation.keyFactors.slice(0, 2),
    recommendedAction: x.intelligence.selection.bestActions[0]?.recommendedAction ?? "analyze_more",
  }));
}
