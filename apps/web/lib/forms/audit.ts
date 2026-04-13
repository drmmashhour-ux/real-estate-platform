import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendLegalFormAudit(args: {
  draftId: string;
  actorUserId: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.legalFormAuditEvent.create({
    data: {
      draftId: args.draftId,
      actorUserId: args.actorUserId,
      eventType: args.eventType,
      metadataJson: (args.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}
