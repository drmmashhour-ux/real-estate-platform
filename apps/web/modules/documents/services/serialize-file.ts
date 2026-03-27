import type { DocumentFile } from "@prisma/client";

/** Never expose raw storage keys or internal paths to clients. */
export function serializeDocumentFile(
  f: DocumentFile & {
    uploadedBy?: { name: string | null; email: string } | null;
  }
) {
  return {
    id: f.id,
    folderId: f.folderId,
    fileName: f.fileName,
    originalName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    status: f.status,
    visibility: f.visibility,
    category: f.category,
    listingId: f.listingId,
    brokerClientId: f.brokerClientId,
    offerId: f.offerId,
    contractId: f.contractId,
    appointmentId: f.appointmentId,
    conversationId: f.conversationId,
    description: f.description,
    tags: f.tags,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    uploadedBy: f.uploadedBy
      ? { name: f.uploadedBy.name, email: f.uploadedBy.email }
      : null,
  };
}
