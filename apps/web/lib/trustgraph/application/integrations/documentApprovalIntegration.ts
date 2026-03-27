import { startDocumentApprovalFlow } from "@/lib/trustgraph/application/startDocumentApprovalFlow";
import { applyDocumentApprovalAction } from "@/lib/trustgraph/application/applyDocumentApprovalAction";

export async function startSellerDocumentApproval(args: {
  sellerDocumentId: string;
  fsboListingId: string;
  workspaceId: string | null;
  startedBy: string;
}) {
  return startDocumentApprovalFlow({
    entityType: "SELLER_SUPPORTING_DOCUMENT",
    entityId: args.sellerDocumentId,
    documentType: "seller_declaration_supporting",
    workspaceId: args.workspaceId,
    startedBy: args.startedBy,
  });
}

export async function startMortgageDocumentApproval(args: {
  mortgageRequestId: string;
  workspaceId: string | null;
  startedBy: string;
}) {
  return startDocumentApprovalFlow({
    entityType: "MORTGAGE_FILE",
    entityId: args.mortgageRequestId,
    documentType: "mortgage_intake",
    workspaceId: args.workspaceId,
    startedBy: args.startedBy,
  });
}

export { applyDocumentApprovalAction };
