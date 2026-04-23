import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { createOrUpdateDealFinancial } from "@/modules/finance/services/deal-financial-service";
import { canManageFinance, canViewFinance } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canViewFinance(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const deal = await prisma.dealFinancial.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { commissionSplits: true },
  });
  if (!deal) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ deal });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canManageFinance(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  try {
    const out = await createOrUpdateDealFinancial({
      tenantId: ctx.tenantId,
      id,
      listingId: body?.listingId ?? null,
      offerId: body?.offerId ?? null,
      contractId: body?.contractId ?? null,
      salePrice: typeof body?.salePrice === "number" ? body.salePrice : null,
      commissionRate: typeof body?.commissionRate === "number" ? body.commissionRate : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
      currency: typeof body?.currency === "string" ? body.currency : undefined,
    });
    return NextResponse.json({ id: out.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
