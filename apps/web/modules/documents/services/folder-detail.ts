import { prisma } from "@/lib/db";
import {
  canAccessFolder,
  canViewDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";

export async function getFolderDetailForViewer(folderId: string, user: UserForDocuments) {
  const folder = await prisma.documentFolder.findUnique({
    where: { id: folderId },
    include: {
      files: {
        where: { status: { not: "DELETED" } },
        orderBy: { updatedAt: "desc" },
        include: {
          uploadedBy: { select: { name: true, email: true } },
          accessGrants: { select: { userId: true } },
        },
      },
    },
  });
  if (!folder) return { ok: false as const, reason: "not_found" as const };
  if (!(await canAccessFolder(user, folder))) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  const files = [];
  for (const f of folder.files) {
    if (await canViewDocument(user, f)) {
      files.push(serializeDocumentFile(f));
    }
  }

  const fileIds = folder.files.map((x) => x.id);
  const events = await prisma.documentEvent.findMany({
    where: {
      OR: [{ folderId }, { documentFileId: { in: fileIds } }],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  return {
    ok: true as const,
    folder: {
      id: folder.id,
      name: folder.name,
      type: folder.type,
      listingId: folder.listingId,
      brokerClientId: folder.brokerClientId,
      offerId: folder.offerId,
      contractId: folder.contractId,
      appointmentId: folder.appointmentId,
      conversationId: folder.conversationId,
      updatedAt: folder.updatedAt.toISOString(),
    },
    files,
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      message: e.message,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
      documentFileId: e.documentFileId,
      folderId: e.folderId,
      actor: e.actor
        ? { id: e.actor.id, name: e.actor.name, email: e.actor.email }
        : null,
    })),
  };
}
