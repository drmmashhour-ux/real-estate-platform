import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export async function logBehaviorSignal(input: {
  ownerType: string;
  ownerId: string;
  signalType: string;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  /** When false, skip audit (e.g. high-volume batched paths). */
  audit?: boolean;
}) {
  const row = await prisma.lecipmUserBehaviorSignal.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      signalType: input.signalType,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });

  if (input.audit !== false) {
    await recordAuditEvent({
      actorUserId: input.ownerId,
      action: "BEHAVIOR_SIGNAL_CREATED",
      payload: { signalId: row.id, signalType: input.signalType },
    });
  }

  return row;
}
