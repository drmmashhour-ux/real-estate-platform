import { updateDocumentStatus } from "@/src/modules/legal-workflow/application/updateDocumentStatus";

export async function approveDocument(args: { documentId: string; actorUserId: string; note?: string }) {
  return updateDocumentStatus({
    documentId: args.documentId,
    actorUserId: args.actorUserId,
    nextStatus: "approved",
    metadata: { note: args.note ?? null, action: "approved" },
  });
}
