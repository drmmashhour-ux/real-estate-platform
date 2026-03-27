import { updateDocumentStatus } from "@/src/modules/legal-workflow/application/updateDocumentStatus";

export async function finalizeDocument(args: { documentId: string; actorUserId: string }) {
  return updateDocumentStatus({
    documentId: args.documentId,
    actorUserId: args.actorUserId,
    nextStatus: "finalized",
    metadata: { action: "finalized" },
  });
}
