import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { scheduleDealRiskEvaluation } from "@/modules/risk-engine/risk-prevention.service";

export async function logSuggestionDecision(input: {
  dealId: string;
  actorId: string;
  action: "approve" | "reject" | "edit_then_approve" | "snooze";
  suggestionType: string;
  suggestionPayload: Record<string, unknown>;
  documentId?: string | null;
  sourceReferences?: unknown;
  validationSnapshot?: unknown;
}) {
  const row = await prisma.suggestionDecisionLog.create({
    data: {
      dealId: input.dealId,
      actorId: input.actorId,
      action: input.action,
      suggestionType: input.suggestionType,
      suggestionPayload: input.suggestionPayload as Prisma.InputJsonValue,
      documentId: input.documentId ?? null,
      sourceReferences: input.sourceReferences === undefined ? undefined : (input.sourceReferences as Prisma.InputJsonValue),
      validationSnapshot: input.validationSnapshot === undefined ? undefined : (input.validationSnapshot as Prisma.InputJsonValue),
    },
  });
  scheduleDealRiskEvaluation(input.dealId);
  return row;
}

export async function listSuggestionDecisions(dealId: string, take = 50) {
  return prisma.suggestionDecisionLog.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
