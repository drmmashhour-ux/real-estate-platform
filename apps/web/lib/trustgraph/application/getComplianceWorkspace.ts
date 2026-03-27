import { getComplianceWorkspaceById } from "@/lib/trustgraph/infrastructure/services/complianceWorkspaceService";

export async function getComplianceWorkspace(workspaceId: string) {
  return getComplianceWorkspaceById(workspaceId);
}
