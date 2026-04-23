import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { markCommissionSplitPaid } from "@/modules/finance/services/commission-service";
import { canApproveCommission } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";
import { notifyCommissionPaid } from "@/modules/finance/services/finance-notification-triggers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canApproveCommission(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const before = await prisma.commissionSplit.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { dealFinancial: true },
  });

  await markCommissionSplitPaid(ctx.tenantId, id);

  if (before?.dealFinancial) {
    await notifyCommissionPaid({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      splitId: id,
      offerId: before.dealFinancial.offerId,
      contractId: before.dealFinancial.contractId,
    });
  }

  return NextResponse.json({ ok: true });
}
