import { updateDocumentStatus } from "@/src/modules/legal-workflow/application/updateDocumentStatus";

export async function requestDocumentReview(args: { documentId: string; actorUserId: string; note?: string }) {
  return updateDocumentStatus({
    documentId: args.documentId,
    actorUserId: args.actorUserId,
    nextStatus: "in_review",
    metadata: { note: args.note ?? null, action: "review_requested" },
  });
}
