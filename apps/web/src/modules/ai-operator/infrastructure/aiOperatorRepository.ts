import { LecipmAiOperatorActionStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { GeneratedAiOperatorAction } from "@/src/modules/ai-operator/domain/operator.types";
import { normalizeAutonomyMode } from "@/src/modules/ai-operator/policies/autonomy";
import { shouldAutoExecuteOnIngest } from "@/src/modules/ai-operator/policies/autonomy";
import type { AiOperatorActionType } from "@/src/modules/ai-operator/domain/operator.enums";
import { executeAction } from "@/src/modules/ai-operator/application/executeAction";

export async function getOrCreateSettings(userId: string) {
  const row = await prisma.lecipmAiOperatorSettings.upsert({
    where: { userId },
    create: { userId, autonomyMode: "manual" },
    update: {},
  });
  return row;
}

export async function updateAutonomyMode(userId: string, mode: string) {
  const normalized = normalizeAutonomyMode(mode);
  return prisma.lecipmAiOperatorSettings.upsert({
    where: { userId },
    create: { userId, autonomyMode: normalized },
    update: { autonomyMode: normalized },
  });
}

export async function listActionsForUser(userId: string, take = 50) {
  return prisma.lecipmAiOperatorAction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getActionForUser(actionId: string, userId: string) {
  return prisma.lecipmAiOperatorAction.findFirst({
    where: { id: actionId, userId },
  });
}

export async function persistGeneratedActions(
  userId: string,
  actions: GeneratedAiOperatorAction[],
  options?: { workspaceId?: string | null }
) {
  const settings = await getOrCreateSettings(userId);
  const mode = normalizeAutonomyMode(settings.autonomyMode);
  const createdIds: string[] = [];
  const workspaceId = options?.workspaceId?.trim() || undefined;

  for (const a of actions) {
    let status: LecipmAiOperatorActionStatus = LecipmAiOperatorActionStatus.suggested;
    if (shouldAutoExecuteOnIngest(mode, a.type as AiOperatorActionType, a.confidenceScore)) {
      status = LecipmAiOperatorActionStatus.approved;
    }

    const row = await prisma.lecipmAiOperatorAction.create({
      data: {
        userId,
        workspaceId: workspaceId ?? null,
        type: a.type,
        context: a.context,
        payload: a.payload as Prisma.InputJsonValue,
        status,
        confidenceScore: a.confidenceScore,
        title: a.title,
        description: a.description,
        reason: a.reason,
        dataUsedSummary: a.dataUsedSummary,
        expectedOutcome: a.expectedOutcome,
        suggestedExecution: a.suggestedExecution as Prisma.InputJsonValue,
        autonomyModeAtCreate: mode,
      },
    });
    createdIds.push(row.id);

    if (status === LecipmAiOperatorActionStatus.approved) {
      await executeAction(row.id, userId);
    }
  }

  return { createdIds, mode };
}

export async function approveAction(actionId: string, userId: string) {
  const row = await prisma.lecipmAiOperatorAction.updateMany({
    where: {
      id: actionId,
      userId,
      status: { in: [LecipmAiOperatorActionStatus.suggested, LecipmAiOperatorActionStatus.pending] },
    },
    data: { status: LecipmAiOperatorActionStatus.approved },
  });
  return row.count > 0;
}

export async function rejectAction(actionId: string, userId: string, notes?: string) {
  const row = await prisma.lecipmAiOperatorAction.updateMany({
    where: {
      id: actionId,
      userId,
      status: { in: [LecipmAiOperatorActionStatus.suggested, LecipmAiOperatorActionStatus.pending] },
    },
    data: {
      status: LecipmAiOperatorActionStatus.rejected,
      outcomeNotes: notes ?? "rejected",
    },
  });
  return row.count > 0;
}

export async function saveEditedPayload(actionId: string, userId: string, edited: Record<string, unknown>) {
  const row = await prisma.lecipmAiOperatorAction.updateMany({
    where: {
      id: actionId,
      userId,
      status: { in: [LecipmAiOperatorActionStatus.suggested, LecipmAiOperatorActionStatus.pending] },
    },
    data: { editedPayload: edited as Prisma.InputJsonValue },
  });
  return row.count > 0;
}

export async function learningStats(userId: string) {
  const grouped = await prisma.lecipmAiOperatorAction.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });
  return Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<string, number>;
}
