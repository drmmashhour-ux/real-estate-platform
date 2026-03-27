import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { canIssueInvoice, canViewFinance } from "@/modules/finance/services/finance-permissions";
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

  const invoice = await prisma.tenantInvoice.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { paymentRecords: true },
  });
  if (!invoice) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canIssueInvoice(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const res = await prisma.tenantInvoice.updateMany({
    where: { id, tenantId: ctx.tenantId, status: "DRAFT" },
    data: {
      ...(typeof body?.notes === "string" ? { notes: body.notes } : {}),
      ...(typeof body?.clientName === "string" ? { clientName: body.clientName } : {}),
      ...(typeof body?.clientEmail === "string" ? { clientEmail: body.clientEmail } : {}),
    },
  });
  if (res.count === 0) return NextResponse.json({ error: "not found or not draft" }, { status: 400 });
  const invoice = await prisma.tenantInvoice.findFirst({ where: { id, tenantId: ctx.tenantId } });
  return NextResponse.json({ invoice });
}
