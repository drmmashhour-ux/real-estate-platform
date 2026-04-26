import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { createCommissionSplits } from "@/modules/finance/services/commission-service";
import { notifyCommissionPendingApproval } from "@/modules/finance/services/finance-notification-triggers";
import { canApproveCommission } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id: dealFinancialId } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canApproveCommission(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const deal = await prisma.dealFinancial.findFirst({
    where: { id: dealFinancialId, tenantId: ctx.tenantId },
  });
  if (!deal?.grossCommission) {
    return NextResponse.json({ error: "deal gross commission required" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const splits = Array.isArray(body?.splits) ? body.splits : [];
  const mode = body?.mode === "amount" ? "amount" : "percent";

  try {
    await createCommissionSplits({
      tenantId: ctx.tenantId,
      dealFinancialId,
      gross: deal.grossCommission,
      mode,
      splits,
    });
    await notifyCommissionPendingApproval({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      dealFinancialId,
      offerId: deal.offerId,
      contractId: deal.contractId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
