import { getDocumentById, listAuditLogs, listDocumentVersions } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

export async function getDocumentWorkflow(documentId: string) {
  const [document, versions, audit] = await Promise.all([
    getDocumentById(documentId),
    listDocumentVersions(documentId),
    listAuditLogs(documentId),
  ]);
  if (!document) return null;
  return {
    document: {
      id: document.id,
      listingId: document.listingId,
      status: document.status,
      updatedAt: document.updatedAt,
      draftPayload: document.draftPayload,
      validationSummary: document.validationSummary,
      aiSummary: document.aiSummary,
      signatures: document.signatures,
    },
    versions,
    audit,
  };
}
