/**
 * AI Decision Log – audit trail for model-driven decisions, overrides, explainability.
 */
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Log an AI decision (call from fraud, policy, ranking flows). */
export async function logAiDecision(params: {
  modelKey: string;
  modelVersion?: string;
  entityType: string;
  entityId: string;
  decision: string;
  score?: number;
  explanation?: string;
  context?: object;
}) {
  const model = await prisma.aiModel.findUnique({ where: { key: params.modelKey } });
  if (!model) return null;
  return prisma.aiDecisionLog.create({
    data: {
      modelId: model.id,
      modelVersion: params.modelVersion,
      entityType: params.entityType,
      entityId: params.entityId,
      decision: params.decision,
      score: params.score,
      explanation: params.explanation,
      context: (params.context as object) ?? undefined,
    },
  });
}

/** Record an admin override on an AI decision. */
export async function overrideAiDecision(logId: string, overriddenBy: string) {
  return prisma.aiDecisionLog.update({
    where: { id: logId },
    data: { overrideBy: overriddenBy, overrideAt: new Date() },
  });
}

/** Get recent AI decision logs (for audit and Control Center). */
export async function getAiDecisionLogs(params: {
  modelKey?: string;
  entityType?: string;
  entityId?: string;
  decision?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.AiDecisionLogWhereInput = {};
  if (params.modelKey) {
    where.model = { key: params.modelKey };
  }
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.decision) where.decision = params.decision;

  const [logs, total] = await Promise.all([
    prisma.aiDecisionLog.findMany({
      where,
      include: { model: { select: { key: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    }),
    prisma.aiDecisionLog.count({ where }),
  ]);
  return { logs, total };
}
