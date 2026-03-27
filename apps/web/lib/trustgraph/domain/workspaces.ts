export type WorkspaceSummaryDto = {
  id: string;
  name: string;
  orgType: string;
  orgId: string;
};

export type WorkspaceQueueItemDto = {
  caseId: string;
  entityType: string;
  entityId: string;
  status: string;
  trustLevel: string | null;
  readinessLevel: string | null;
  assignedTo: string | null;
  priority: string;
  dueAt: string | null;
};

export const WORKSPACE_REVIEW_ROLES = [
  "workspace_admin",
  "workspace_manager",
  "workspace_reviewer",
  "workspace_legal_reviewer",
] as const;

export function isWorkspaceReviewRole(role: string): boolean {
  return (WORKSPACE_REVIEW_ROLES as readonly string[]).includes(role);
}
