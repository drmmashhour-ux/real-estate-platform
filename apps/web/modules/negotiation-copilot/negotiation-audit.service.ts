import { prisma } from "@/lib/db";
import { asInputJsonValue } from "@/lib/prisma/as-input-json";

export async function logNegotiationEvent(
  dealId: string,
  actionKey: string,
  payload: Record<string, unknown>,
  actorUserId?: string | null,
) {
  await prisma.dealExecutionAuditLog.create({
    data: { dealId, actorUserId: actorUserId ?? null, actionKey, payload: asInputJsonValue(payload) },
  });
}
