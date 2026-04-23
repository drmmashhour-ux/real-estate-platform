import { NextRequest, NextResponse } from "next/server";
import type { TenantRole, TenantMembershipStatus } from "@prisma/client";
import { prisma } from "@repo/db";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { assertTenantAccess } from "@/modules/tenancy/services/tenant-context-service";
import { canManageTenantMembers, type TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

const ROLES = new Set<TenantRole>([
  "TENANT_OWNER",
  "TENANT_ADMIN",
  "BROKER",
  "ASSISTANT",
  "STAFF",
  "VIEWER",
]);

/** GET /api/tenants/[id]/members */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId } = await context.params;

  try {
    await assertTenantAccess(user.id, tenantId, user.role);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const members = await prisma.tenantMembership.findMany({
    where: { tenantId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      role: m.role,
      status: m.status,
      user: m.user,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

/** POST /api/tenants/[id]/members — add or invite by user id (email invite flow can extend later). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId } = await context.params;

  let membership;
  try {
    membership = await assertTenantAccess(user.id, tenantId, user.role);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "not found" }, { status: 404 });

  const subject: TenantSubject = { platformRole: user.role, membership };
  if (!canManageTenantMembers(subject, tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const targetUserId = typeof body?.userId === "string" ? body.userId.trim() : null;
  const role = body?.role as TenantRole | undefined;
  if (!targetUserId || !role || !ROLES.has(role)) {
    return NextResponse.json({ error: "userId and valid role required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const row = await prisma.tenantMembership.upsert({
    where: { tenantId_userId: { tenantId, userId: targetUserId } },
    create: {
      tenantId,
      userId: targetUserId,
      role,
      status: "INVITED",
    },
    update: { role, status: "INVITED" as TenantMembershipStatus },
  });

  return NextResponse.json({
    membership: {
      id: row.id,
      role: row.role,
      status: row.status,
    },
  });
}
