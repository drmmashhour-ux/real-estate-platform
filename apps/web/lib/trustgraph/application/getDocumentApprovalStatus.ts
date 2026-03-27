import { getDocumentApprovalSummary } from "@/lib/trustgraph/infrastructure/services/documentApprovalService";

export async function getDocumentApprovalStatus(flowId: string) {
  return getDocumentApprovalSummary(flowId);
}
