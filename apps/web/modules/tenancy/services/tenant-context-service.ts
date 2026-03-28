import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PlatformRole, Tenant, TenantMembership, TenantMembershipStatus, TenantRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseSessionUserId, TENANT_CONTEXT_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";

export const TENANT_ID_HEADER = "x-tenant-id" as const;

export type ResolvedTenantContext = {
  userId: string;
  platformRole: PlatformRole;
  tenantId: string;
  tenant: Tenant;
  membership: TenantMembership;
};

/** Prefer header (API clients) then cookie (browser). Subdomain resolution can be added here later. */
export function getRequestedTenantIdFromRequest(request: NextRequest): string | null {
  const header = request.headers.get(TENANT_ID_HEADER)?.trim();
  if (header) return header;
  const cookie = request.cookies.get(TENANT_CONTEXT_COOKIE_NAME)?.value;
  return parseSessionUserId(cookie);
}

export async function getUserTenantMembership(
  userId: string,
  tenantId: string,
  opts: { statuses?: TenantMembershipStatus[] } = {}
): Promise<TenantMembership | null> {
  const statuses = opts.statuses ?? ["ACTIVE"];
  return prisma.tenantMembership.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  }).then((m) => (m && statuses.includes(m.status) ? m : null));
}

/**
 * Ensures the user may access the tenant. Platform ADMIN may pass without membership (audit).
 */
export async function assertTenantAccess(
  userId: string,
  tenantId: string,
  platformRole: PlatformRole,
  opts: { minRoles?: TenantRole[] } = {}
): Promise<TenantMembership> {
  const { minRoles } = opts;

  if (platformRole === "ADMIN") {
    const m = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (m?.status === "ACTIVE") {
      if (minRoles?.length && !minRoles.includes(m.role)) throw new Error("tenant_forbidden");
      return m;
    }
    const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
    if (!tenant) throw new Error("tenant_not_found");
    return {
      id: `admin:${userId}:${tenantId}`,
      tenantId,
      userId,
      role: "TENANT_OWNER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const membership = await getUserTenantMembership(userId, tenantId);
  if (!membership) throw new Error("tenant_forbidden");
  if (minRoles?.length && !minRoles.includes(membership.role)) throw new Error("tenant_forbidden");
  return membership;
}

/**
 * Resolves tenant + membership for the current request. Returns null if no tenant id was selected.
 */
export async function getCurrentTenantFromRequest(
  request: NextRequest,
  userId: string,
  platformRole: PlatformRole
): Promise<ResolvedTenantContext | null> {
  const tenantId = getRequestedTenantIdFromRequest(request);
  if (!tenantId) return null;

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, status: "ACTIVE" },
  });
  if (!tenant) return null;

  if (platformRole === "ADMIN") {
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (membership?.status === "ACTIVE") {
      return { userId, platformRole, tenantId, tenant, membership };
    }
    return {
      userId,
      platformRole,
      tenantId,
      tenant,
      membership: {
        id: `admin:${userId}:${tenantId}`,
        tenantId,
        userId,
        role: "TENANT_OWNER",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  const membership = await getUserTenantMembership(userId, tenantId);
  if (!membership) return null;

  return { userId, platformRole, tenantId, tenant, membership };
}

/** Requires session + tenant id + membership (or platform admin override). */
export async function requireTenantContext(
  request: NextRequest
): Promise<{ ctx: ResolvedTenantContext } | NextResponse> {
  const session = await requireSessionUserIdOr401(request);
  if (session instanceof NextResponse) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getCurrentTenantFromRequest(request, user.id, user.role);
  if (!ctx) {
    return NextResponse.json(
      { error: "workspace_required", message: "Select a workspace or pass x-tenant-id." },
      { status: 400 }
    );
  }

  return { ctx };
}
