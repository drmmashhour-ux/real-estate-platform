import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canAccessFolder, canViewDocument, type UserForDocuments } from "@/modules/documents/services/document-permissions";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";

export async function getDocumentCenterPayload(userId: string, role: PlatformRole) {
  const user: UserForDocuments = { id: userId, role };

  const folders = await prisma.documentFolder.findMany({
    take: 300,
    orderBy: { updatedAt: "desc" },
    include: {
      files: {
        where: { status: { not: "DELETED" } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          uploadedBy: { select: { name: true, email: true } },
          accessGrants: { select: { userId: true } },
        },
      },
    },
  });

  const accessibleFolders = [];
  for (const f of folders) {
    if (await canAccessFolder(user, f)) {
      accessibleFolders.push({
        id: f.id,
        name: f.name,
        type: f.type,
        listingId: f.listingId,
        brokerClientId: f.brokerClientId,
        offerId: f.offerId,
        contractId: f.contractId,
        appointmentId: f.appointmentId,
        conversationId: f.conversationId,
        updatedAt: f.updatedAt.toISOString(),
        recentFiles: (
          await Promise.all(
            f.files.map(async (file) =>
              (await canViewDocument(user, file)) ? serializeDocumentFile(file) : null
            )
          )
        ).filter(Boolean),
      });
    }
  }

  const recentUploads = await prisma.documentFile.findMany({
    where: {
      uploadedById: userId,
      status: { not: "DELETED" },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  const sharedWithMe = await prisma.documentFile.findMany({
    where: {
      status: { not: "DELETED" },
      accessGrants: { some: { userId } },
    },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  const mapVisible = async (files: typeof recentUploads) => {
    const out = [];
    for (const file of files) {
      if (await canViewDocument(user, file)) {
        out.push(serializeDocumentFile(file));
      }
    }
    return out;
  };

  return {
    folders: accessibleFolders,
    recentUploads: await mapVisible(recentUploads),
    sharedWithMe: await mapVisible(sharedWithMe),
  };
}
