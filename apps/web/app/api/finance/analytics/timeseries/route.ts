import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireSessionUser } from "@/modules/tenancy/services/tenant-api-helpers";
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { canViewTenantAnalytics } from "@/modules/tenancy/services/tenant-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireSessionUser(request);
  if (user instanceof NextResponse) return user;

  const url = new URL(request.url);
  const adminTenantId = url.searchParams.get("tenantId")?.trim();
  const days = Math.min(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  let tenantId: string;
  if (user.role === "ADMIN" && adminTenantId) {
    tenantId = adminTenantId;
  } else {
    const r = await requireTenantContext(request);
    if (r instanceof NextResponse) return r;
    const { ctx } = r;
    const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
    if (!canViewTenantAnalytics(subject, ctx.tenant)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    tenantId = ctx.tenantId;
  }

  const [payments, invoices] = await Promise.all([
    prisma.paymentRecord.findMany({
      where: { tenantId, status: "SUCCEEDED", createdAt: { gte: since } },
      select: { amount: true, createdAt: true, type: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tenantInvoice.findMany({
      where: { tenantId, createdAt: { gte: since } },
      select: { totalAmount: true, status: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    tenantId,
    since: since.toISOString(),
    payments,
    invoices,
  });
}
