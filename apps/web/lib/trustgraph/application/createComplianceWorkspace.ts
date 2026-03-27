import { createComplianceWorkspaceRecord } from "@/lib/trustgraph/infrastructure/services/complianceWorkspaceService";
import type { TrustgraphComplianceOrgType } from "@prisma/client";

export async function createComplianceWorkspace(args: {
  orgType: TrustgraphComplianceOrgType;
  orgId: string;
  name: string;
  branding?: object | null;
  settings?: object | null;
  creatorUserId: string;
}) {
  return createComplianceWorkspaceRecord(args);
}
