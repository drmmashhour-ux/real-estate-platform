import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { approveCommissionSplit } from "@/modules/finance/services/commission-service";
import { canApproveCommission } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";
import { notifyCommissionApproved } from "@/modules/finance/services/finance-notification-triggers";

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

  await approveCommissionSplit(ctx.tenantId, id);

  if (before?.dealFinancial) {
    await notifyCommissionApproved({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      dealFinancialId: before.dealFinancialId,
      offerId: before.dealFinancial.offerId,
      contractId: before.dealFinancial.contractId,
    });
  }

  return NextResponse.json({ ok: true });
}
