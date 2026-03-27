import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { canViewTenantAnalytics } from "@/modules/tenancy/services/tenant-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

async function aggregate(tenantId: string) {
  const [pendingSplits, unpaidInvoices, paidInvoices, payments] = await Promise.all([
    prisma.commissionSplit.count({ where: { tenantId, status: "PENDING" } }),
    prisma.tenantInvoice.aggregate({
      where: { tenantId, status: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { totalAmount: true },
    }),
    prisma.tenantInvoice.aggregate({
      where: { tenantId, status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.paymentRecord.aggregate({
      where: { tenantId, status: "SUCCEEDED", type: "INCOMING" },
      _sum: { amount: true },
    }),
  ]);

  const dealAgg = await prisma.dealFinancial.aggregate({
    where: { tenantId },
    _sum: { netCommission: true, grossCommission: true },
  });

  return {
    pendingCommissionSplits: pendingSplits,
    unpaidInvoiceTotal: unpaidInvoices._sum.totalAmount ?? 0,
    paidInvoiceTotal: paidInvoices._sum.totalAmount ?? 0,
    incomingPaymentsTotal: payments._sum.amount ?? 0,
    trackedGrossCommission: dealAgg._sum.grossCommission ?? 0,
    trackedNetCommission: dealAgg._sum.netCommission ?? 0,
  };
}

export async function GET(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const adminTenantId = url.searchParams.get("tenantId")?.trim();

  if (user.role === "ADMIN" && adminTenantId) {
    const overview = await aggregate(adminTenantId);
    return NextResponse.json({ tenantId: adminTenantId, overview });
  }

  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canViewTenantAnalytics(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const overview = await aggregate(ctx.tenantId);
  return NextResponse.json({ tenantId: ctx.tenantId, overview });
}
