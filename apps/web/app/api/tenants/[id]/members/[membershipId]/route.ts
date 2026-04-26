import { NextRequest, NextResponse } from "next/server";
import type { TenantRole, TenantMembershipStatus } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; membershipId: string }> }
) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId, membershipId } = await context.params;

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
  const role = body?.role as TenantRole | undefined;
  const status = body?.status as TenantMembershipStatus | undefined;

  if (role && !ROLES.has(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const row = await prisma.tenantMembership.updateMany({
    where: { id: membershipId, tenantId },
    data: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    },
  });
  if (row.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.tenantMembership.findFirst({ where: { id: membershipId, tenantId } });
  return NextResponse.json({ membership: updated });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; membershipId: string }> }
) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId, membershipId } = await context.params;

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

  await prisma.tenantMembership.updateMany({
    where: { id: membershipId, tenantId },
    data: { status: "REMOVED" },
  });

  return NextResponse.json({ ok: true });
}
