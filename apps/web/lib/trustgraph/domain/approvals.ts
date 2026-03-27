export type DocumentApprovalActionType =
  | "approve"
  | "reject"
  | "request_changes"
  | "reassign"
  | "escalate";

export type DocumentApprovalSummaryDto = {
  flowId: string;
  entityType: string;
  entityId: string;
  documentType: string;
  currentStatus: string;
  workspaceId: string | null;
  steps: { id: string; stepKind: string; status: string; dueAt: string | null }[];
};
