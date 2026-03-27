import type { LecipmWorkspaceRole } from "@prisma/client";
import { roleHasPermission } from "@/modules/enterprise/domain/workspacePermissions";

export function canRecordDealOutcome(args: {
  isPlatformAdmin: boolean;
  role: LecipmWorkspaceRole;
  userId: string;
  dealBrokerId: string | null;
}): boolean {
  if (args.isPlatformAdmin) return true;
  if (roleHasPermission(args.role, "manage_listings")) return true;
  if (args.dealBrokerId != null && args.dealBrokerId === args.userId) return true;
  return false;
}
