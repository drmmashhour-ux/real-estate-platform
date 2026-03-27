import { applyDocumentApprovalActionRecord } from "@/lib/trustgraph/infrastructure/services/documentApprovalService";

export async function applyDocumentApprovalAction(args: Parameters<typeof applyDocumentApprovalActionRecord>[0]) {
  return applyDocumentApprovalActionRecord(args);
}
