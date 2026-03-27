import { buildWhiteLabelDashboardSafe } from "@/lib/trustgraph/infrastructure/services/whiteLabelDashboardService";

export async function loadWhiteLabelDashboardForWorkspace(workspaceId: string) {
  return buildWhiteLabelDashboardSafe(workspaceId);
}
