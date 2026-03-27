import type { ClientIntakeEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logIntakeEvent(params: {
  type: ClientIntakeEventType;
  brokerClientId: string;
  intakeProfileId?: string | null;
  requiredDocumentItemId?: string | null;
  actorId?: string | null;
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.clientIntakeEvent.create({
    data: {
      type: params.type,
      brokerClientId: params.brokerClientId,
      intakeProfileId: params.intakeProfileId ?? undefined,
      requiredDocumentItemId: params.requiredDocumentItemId ?? undefined,
      actorId: params.actorId ?? undefined,
      message: params.message ?? undefined,
      metadata: params.metadata === undefined ? undefined : (params.metadata as object),
    },
  });
}
