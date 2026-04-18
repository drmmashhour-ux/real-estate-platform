import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logApprovalAction(input: {
  dealId: string;
  actorUserId: string;
  actionKey: string;
  payload?: Record<string, unknown>;
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
