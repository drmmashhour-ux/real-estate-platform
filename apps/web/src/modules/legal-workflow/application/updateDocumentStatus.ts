import { captureServerEvent } from "@/lib/analytics/posthog-server";
import {
  assertNegotiationApprovalAllowed,
  NegotiationGateError,
} from "@/src/modules/negotiation-chain-engine/application/negotiationSignatureGuard";
import { canTransition } from "@/src/modules/legal-workflow/domain/workflow.rules";
import type { WorkflowTransitionInput } from "@/src/modules/legal-workflow/domain/workflow.types";
import { createAuditLog, getDocumentById, updateDocumentStatusRow } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

export async function updateDocumentStatus(input: WorkflowTransitionInput) {
  const doc = await getDocumentById(input.documentId);
  if (!doc) throw new Error("Document not found");
  const current = doc.status as any;
  if (current === input.nextStatus) return doc;
  if (!canTransition(current, input.nextStatus)) throw new Error(`Invalid status transition ${current} -> ${input.nextStatus}`);

  if (input.nextStatus === "approved") {
    const neg = await assertNegotiationApprovalAllowed(input.documentId);
    if (!neg.ok) {
      throw new NegotiationGateError(neg.message);
    }
  }

  const updated = await updateDocumentStatusRow(input.documentId, input.nextStatus);
  await createAuditLog({
    documentId: input.documentId,
    actorUserId: input.actorUserId,
    actionType: "status_changed",
    metadata: { from: current, to: input.nextStatus, ...(input.metadata ?? {}) },
  });
  captureServerEvent(input.actorUserId, "legal_document_status_changed", { documentId: input.documentId, from: current, to: input.nextStatus });
  return updated;
}
