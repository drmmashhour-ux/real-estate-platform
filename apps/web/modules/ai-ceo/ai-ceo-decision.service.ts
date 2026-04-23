import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import type { AiCeoDecisionStatus } from "@/modules/ai-ceo/ai-ceo.types";

export async function applyAiCeoRecommendationDecision(params: {
  recommendationId: string;
  actorUserId: string;
  decision: AiCeoDecisionStatus;
  outcomeNotes?: string | null;
  outcomeImpactBand?: string | null;
}): Promise<void> {
  const notesPayload =
    params.outcomeNotes ?
      ({ text: params.outcomeNotes, decidedAt: new Date().toISOString() } as Record<string, unknown>)
    : undefined;

  await prisma.lecipmAiCeoRecommendation.update({
    where: { id: params.recommendationId },
    data: {
      decisionStatus: params.decision,
      decidedAt: new Date(),
      decidedByUserId: params.actorUserId,
      ...(notesPayload ? { outcomeNotesJson: notesPayload as object } : {}),
      ...(params.outcomeImpactBand ? { outcomeImpactBand: params.outcomeImpactBand } : {}),
    },
  });

  await recordAuditEvent({
    actorUserId: params.actorUserId,
    action: "AI_CEO_RECOMMENDATION_DECISION",
    payload: {
      recommendationId: params.recommendationId,
      decision: params.decision,
    },
  });
}
