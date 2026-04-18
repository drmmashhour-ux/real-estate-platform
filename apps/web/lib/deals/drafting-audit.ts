import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logDraftingAudit(input: {
  dealId: string;
  actorUserId: string | null;
  actionKey: string;
  payload?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.dealExecutionAuditLog.create({
    data: {
      dealId: input.dealId,
      actorUserId: input.actorUserId,
      actionKey: input.actionKey,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
    },
  });
}
