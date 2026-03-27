import { startDocumentApprovalFlowRecord } from "@/lib/trustgraph/infrastructure/services/documentApprovalService";

export async function startDocumentApprovalFlow(args: Parameters<typeof startDocumentApprovalFlowRecord>[0]) {
  return startDocumentApprovalFlowRecord(args);
}
