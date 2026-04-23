import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { markInvoiceIssued } from "@/modules/finance/services/invoice-service";
import { canIssueInvoice } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";
import { notifyInvoiceIssued } from "@/modules/finance/services/finance-notification-triggers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canIssueInvoice(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const out = await markInvoiceIssued(ctx.tenantId, id);
  if (out.count === 0) return NextResponse.json({ error: "not found or not draft" }, { status: 400 });

  const inv = await prisma.tenantInvoice.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (inv) {
    await notifyInvoiceIssued({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      invoiceNumber: inv.invoiceNumber,
      tenantInvoiceId: inv.id,
      offerId: inv.offerId,
      contractId: inv.contractId,
    });
  }

  return NextResponse.json({ ok: true });
}
