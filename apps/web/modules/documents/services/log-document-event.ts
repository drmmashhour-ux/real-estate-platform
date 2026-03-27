import type { DocumentEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function logDocumentEvent(params: {
  type: DocumentEventType;
  actorId: string | null;
  documentFileId?: string | null;
  folderId?: string | null;
  message?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.documentEvent.create({
    data: {
      type: params.type,
      actorId: params.actorId,
      documentFileId: params.documentFileId ?? undefined,
      folderId: params.folderId ?? undefined,
      message: params.message ?? undefined,
      metadata: params.metadata === undefined ? undefined : (params.metadata as object),
    },
  });
}
