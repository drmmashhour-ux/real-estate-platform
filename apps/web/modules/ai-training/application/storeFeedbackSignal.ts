import type { PrismaClient, Prisma } from "@prisma/client";

export async function storeFeedbackSignal(
  db: PrismaClient,
  input: {
    subsystem: string;
    entityType: string;
    entityId: string;
    userId?: string | null;
    promptOrQuery: string;
    outputSummary: string;
    rating?: number | null;
    accepted?: boolean | null;
    actionTaken?: string | null;
    metadata?: Record<string, unknown> | null;
  }
) {
  return db.aiFeedbackEvent.create({
    data: {
      subsystem: input.subsystem,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId ?? null,
      promptOrQuery: input.promptOrQuery,
      outputSummary: input.outputSummary,
      rating: input.rating ?? null,
      accepted: input.accepted ?? null,
      actionTaken: input.actionTaken ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
