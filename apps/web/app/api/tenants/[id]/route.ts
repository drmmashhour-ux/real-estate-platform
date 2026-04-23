import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { assertTenantAccess } from "@/modules/tenancy/services/tenant-context-service";
import { canManageTenant, type TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId } = await context.params;

  try {
    await assertTenantAccess(user.id, tenantId, user.role);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
  });
  if (!tenant) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      settings: tenant.settings,
      ownerUserId: tenant.ownerUserId,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId } = await context.params;

  let membership;
  try {
    membership = await assertTenantAccess(user.id, tenantId, user.role);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const subject: TenantSubject = { platformRole: user.role, membership };
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!canManageTenant(subject, tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const settings = body?.settings;

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(name ? { name } : {}),
      ...(settings !== undefined ? { settings: settings === null ? undefined : settings } : {}),
    },
  });

  return NextResponse.json({
    tenant: {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      status: updated.status,
      settings: updated.settings,
    },
  });
}
