import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { markInvoicePaid } from "@/modules/finance/services/invoice-service";
import { canRecordPayment } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canRecordPayment(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await markInvoicePaid(ctx.tenantId, id);
  const inv = await prisma.tenantInvoice.findFirst({ where: { id, tenantId: ctx.tenantId } });
  return NextResponse.json({ ok: true, invoice: inv });
}
