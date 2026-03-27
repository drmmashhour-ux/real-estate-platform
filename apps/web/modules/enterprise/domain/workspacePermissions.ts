import { LecipmWorkspaceRole } from "@prisma/client";

/** Central permission strings for LECIPM enterprise workspaces. */
export type WorkspacePermission =
  | "manage_workspace"
  | "view_billing"
  | "manage_members"
  | "manage_listings"
  | "run_trustgraph"
  | "run_deal_analysis"
  | "access_copilot"
  | "view_internal_analytics"
  | "review_compliance_cases";

export const ALL_WORKSPACE_PERMISSIONS: WorkspacePermission[] = [
  "manage_workspace",
  "view_billing",
  "manage_members",
  "manage_listings",
  "run_trustgraph",
  "run_deal_analysis",
  "access_copilot",
  "view_internal_analytics",
  "review_compliance_cases",
];

const ALL = ALL_WORKSPACE_PERMISSIONS;

/** Role → permissions (single source of truth). */
export const WORKSPACE_ROLE_PERMISSIONS: Record<LecipmWorkspaceRole, ReadonlySet<WorkspacePermission>> = {
  [LecipmWorkspaceRole.owner]: new Set(ALL),
  [LecipmWorkspaceRole.admin]: new Set(ALL),
  [LecipmWorkspaceRole.manager]: new Set([
    "manage_listings",
    "run_trustgraph",
    "run_deal_analysis",
    "access_copilot",
    "view_internal_analytics",
    "manage_members",
    "view_billing",
  ]),
  [LecipmWorkspaceRole.broker]: new Set([
    "manage_listings",
    "run_trustgraph",
    "run_deal_analysis",
    "access_copilot",
    "view_internal_analytics",
  ]),
  [LecipmWorkspaceRole.analyst]: new Set([
    "run_trustgraph",
    "run_deal_analysis",
    "access_copilot",
    "view_internal_analytics",
  ]),
  [LecipmWorkspaceRole.viewer]: new Set(["view_internal_analytics"]),
  [LecipmWorkspaceRole.compliance_reviewer]: new Set(["review_compliance_cases", "run_trustgraph", "view_internal_analytics"]),
};

export function roleHasPermission(role: LecipmWorkspaceRole, permission: WorkspacePermission): boolean {
  return WORKSPACE_ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
