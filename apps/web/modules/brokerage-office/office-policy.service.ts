import type { OfficeMembershipRole } from "@prisma/client";
import { roleCanApproveCommissions, roleCanManageRoster, roleCanViewOfficeFinance } from "@/lib/brokerage/office-access";

/** Policy helpers — keep logic centralized for RBAC messaging. */
export function describeRoleCapabilities(role: OfficeMembershipRole) {
  return {
    viewOfficeFinance: roleCanViewOfficeFinance(role),
    manageRoster: roleCanManageRoster(role),
    approveCommissions: roleCanApproveCommissions(role),
  };
}
