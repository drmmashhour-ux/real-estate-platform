import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { assertTenantAccess } from "@/modules/tenancy/services/tenant-context-service";
import { canManageTenant, type TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

/** GET /api/tenants/[id]/billing — agency billing profile (SaaS prep). */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;
  const { id: tenantId } = await context.params;

  try {
    await assertTenantAccess(user.id, tenantId, user.role);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const profile = await prisma.tenantBillingProfile.findUnique({
    where: { tenantId },
  });

  return NextResponse.json({
    billing: profile
      ? {
          id: profile.id,
          legalName: profile.legalName,
          billingEmail: profile.billingEmail,
          addressData: profile.addressData,
          taxNumber: profile.taxNumber,
          updatedAt: profile.updatedAt.toISOString(),
        }
      : null,
  });
}

/** PATCH /api/tenants/[id]/billing — upsert billing profile. */
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

  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: "not found" }, { status: 404 });

  const subject: TenantSubject = { platformRole: user.role, membership };
  if (!canManageTenant(subject, tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  const profile = await prisma.tenantBillingProfile.upsert({
    where: { tenantId },
    create: {
      tenantId,
      legalName: typeof body?.legalName === "string" ? body.legalName : null,
      billingEmail: typeof body?.billingEmail === "string" ? body.billingEmail : null,
      addressData: body?.addressData === undefined ? undefined : body.addressData,
      taxNumber: typeof body?.taxNumber === "string" ? body.taxNumber : null,
    },
    update: {
      ...(typeof body?.legalName === "string" ? { legalName: body.legalName } : {}),
      ...(typeof body?.billingEmail === "string" ? { billingEmail: body.billingEmail } : {}),
      ...(body?.addressData !== undefined ? { addressData: body.addressData } : {}),
      ...(typeof body?.taxNumber === "string" ? { taxNumber: body.taxNumber } : {}),
    },
  });

  return NextResponse.json({
    billing: {
      id: profile.id,
      legalName: profile.legalName,
      billingEmail: profile.billingEmail,
      addressData: profile.addressData,
      taxNumber: profile.taxNumber,
    },
  });
}
