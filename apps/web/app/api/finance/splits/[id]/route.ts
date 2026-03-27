import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { canApproveCommission } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const { id } = await context.params;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canApproveCommission(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const res = await prisma.commissionSplit.updateMany({
    where: { id, tenantId: ctx.tenantId },
    data: {
      ...(typeof body?.percent === "number" ? { percent: body.percent } : {}),
      ...(typeof body?.amount === "number" ? { amount: body.amount } : {}),
      ...(typeof body?.roleLabel === "string" ? { roleLabel: body.roleLabel } : {}),
      ...(typeof body?.userId === "string" ? { userId: body.userId } : {}),
    },
  });
  if (res.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
