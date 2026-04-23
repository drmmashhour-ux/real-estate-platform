import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { applyPositiveOutcomeLearning } from "@/modules/self-expansion/self-expansion-learning.service";
import type { ExpansionDecisionStatus } from "@/modules/self-expansion/self-expansion.types";

export async function applySelfExpansionDecision(params: {
  recommendationId: string;
  actorUserId: string;
  decision: ExpansionDecisionStatus;
  reason?: string | null;
  outcomeNotes?: string | null;
  outcomeImpactBand?: string | null;
  outcomeMetricsJson?: Record<string, unknown> | null;
}): Promise<void> {
  const notesPayload =
    params.outcomeNotes ?
      ({ text: params.outcomeNotes, decidedAt: new Date().toISOString() } as Record<string, unknown>)
    : undefined;

  const row = await prisma.lecipmSelfExpansionRecommendation.update({
    where: { id: params.recommendationId },
    data: {
      decisionStatus: params.decision,
      decidedAt: new Date(),
      decidedByUserId: params.actorUserId,
      decisionReason: params.reason ?? undefined,
      ...(notesPayload ? { outcomeNotesJson: notesPayload as object } : {}),
      ...(params.outcomeImpactBand ? { outcomeImpactBand: params.outcomeImpactBand } : {}),
      ...(params.outcomeMetricsJson ? { outcomeMetricsJson: params.outcomeMetricsJson as object } : {}),
    },
  });

  await recordAuditEvent({
    actorUserId: params.actorUserId,
    action: "SELF_EXPANSION_DECISION",
    payload: {
      recommendationId: params.recommendationId,
      decision: params.decision,
      territoryId: row.territoryId,
    },
  });

  if (
    params.decision === "COMPLETED" &&
    params.outcomeImpactBand &&
    /positive|meaningful|strong/i.test(params.outcomeImpactBand)
  ) {
    await applyPositiveOutcomeLearning({
      entryHub: row.entryHub,
      archetype: (row.inputSnapshotJson as { archetype?: string })?.archetype ?? "metro_core",
      blockerHint: null,
    });
  }
}
