import { TenantMembershipStatus, TenantRole } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getTenantMembership(tenantId: string, userId: string) {
  return prisma.tenantMembership.findFirst({
    where: {
      tenantId,
      userId,
      status: TenantMembershipStatus.ACTIVE,
    },
  });
}

export function assertTenantRole(role: TenantRole, allowed: TenantRole[]) {
  if (!allowed.includes(role)) {
    throw new Error("TENANT_PERMISSION_DENIED");
  }
}

/** Roles that may edit branding / tenant settings */
export const TENANT_BRAND_ROLES: TenantRole[] = [TenantRole.TENANT_OWNER, TenantRole.TENANT_ADMIN];
