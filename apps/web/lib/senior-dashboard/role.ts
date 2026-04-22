import { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { SeniorDashboardRoleKind } from "@/modules/senior-living/dashboard/dashboard.types";

export type ResolvedSeniorHubAccess =
  | { kind: "platform_admin" }
  | { kind: "residence_manager"; residenceIds: string[] }
  | { kind: "residence_operator"; residenceId: string }
  | { kind: "none" };

/**
 * Map product roles to senior hub dashboard personas.
 * - PLATFORM_ADMIN: full platform
 * - RESIDENCE_MANAGER: multi-residence or broker oversight
 * - RESIDENCE_OPERATOR: single assigned residence
 */
export function mapToDashboardRoleKind(access: ResolvedSeniorHubAccess): SeniorDashboardRoleKind {
  if (access.kind === "platform_admin") return "PLATFORM_ADMIN";
  if (access.kind === "residence_manager") return "RESIDENCE_MANAGER";
  return "RESIDENCE_OPERATOR";
}

export async function resolveSeniorHubAccess(
  userId: string,
  role: PlatformRole,
): Promise<ResolvedSeniorHubAccess> {
  if (role === PlatformRole.ADMIN) {
    return { kind: "platform_admin" };
  }

  const operated = await prisma.seniorResidence.findMany({
    where: { operatorId: userId },
    select: { id: true },
  });
  const ids = operated.map((r) => r.id);

  if (ids.length === 0) {
    if (role === PlatformRole.BROKER) {
      return { kind: "residence_manager", residenceIds: [] };
    }
    return { kind: "none" };
  }

  if (role === PlatformRole.BROKER || ids.length >= 2) {
    return { kind: "residence_manager", residenceIds: ids };
  }

  return { kind: "residence_operator", residenceId: ids[0]! };
}

export function canAccessResidenceDashboard(access: ResolvedSeniorHubAccess): boolean {
  return access.kind === "residence_operator" || access.kind === "platform_admin";
}

export function canAccessManagementDashboard(access: ResolvedSeniorHubAccess): boolean {
  return access.kind === "residence_manager" || access.kind === "platform_admin";
}

export function canAccessAdminDashboard(access: ResolvedSeniorHubAccess): boolean {
  return access.kind === "platform_admin";
}
