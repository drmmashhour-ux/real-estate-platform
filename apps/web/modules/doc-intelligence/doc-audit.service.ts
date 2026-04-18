import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logDocumentAudit(input: {
  dealId: string;
  actorUserId: string | null;
  actionKey: string;
  payload?: Record<string, unknown>;
}) {
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: input.actionKey,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}
