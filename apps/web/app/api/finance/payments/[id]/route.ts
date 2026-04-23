import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { updatePaymentRecord } from "@/modules/finance/services/payment-record-service";
import { canRecordPayment, canViewFinance } from "@/modules/finance/services/finance-permissions";
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

  const payment = await prisma.paymentRecord.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ payment });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canRecordPayment(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  try {
    const payment = await updatePaymentRecord(ctx.tenantId, id, {
      status: body?.status,
      notes: body?.notes,
      provider: body?.provider,
      providerRef: body?.providerRef,
    });
    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
