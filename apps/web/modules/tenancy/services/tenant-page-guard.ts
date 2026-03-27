import { cookies } from "next/headers";
import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { getUserTenantMembership } from "@/modules/tenancy/services/tenant-context-service";

/**
 * Validates the workspace cookie against the current user (server components).
 * Prevents tampered cookies from exposing another tenant's data.
 */
export async function getVerifiedTenantIdForUser(
  userId: string,
  platformRole: PlatformRole
): Promise<string | null> {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get(TENANT_CONTEXT_COOKIE_NAME)?.value?.trim() ?? null;
  if (!tenantId) return null;

  if (platformRole === "ADMIN") {
    const t = await prisma.tenant.findFirst({ where: { id: tenantId, status: "ACTIVE" } });
    return t ? tenantId : null;
  }

  const m = await getUserTenantMembership(userId, tenantId);
  return m ? tenantId : null;
}
