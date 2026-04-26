import { NextRequest, NextResponse } from "next/server";
import type { PaymentRecordType } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { recordPayment } from "@/modules/finance/services/payment-record-service";
import { canRecordPayment, canViewFinance } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

const TYPES = new Set<PaymentRecordType>(["INCOMING", "OUTGOING", "ADJUSTMENT"]);

export async function GET(request: NextRequest) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canViewFinance(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payments = await prisma.paymentRecord.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ payments });
}

export async function POST(request: NextRequest) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canRecordPayment(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type as PaymentRecordType | undefined;
  const amount = typeof body?.amount === "number" ? body.amount : NaN;
  if (!type || !TYPES.has(type) || Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "type and positive amount required" }, { status: 400 });
  }

  const row = await recordPayment({
    tenantId: ctx.tenantId,
    type,
    amount,
    currency: typeof body?.currency === "string" ? body.currency : undefined,
    invoiceId: typeof body?.tenantInvoiceId === "string" ? body.tenantInvoiceId : body?.invoiceId ?? null,
    dealFinancialId: typeof body?.dealFinancialId === "string" ? body.dealFinancialId : null,
    provider: body?.provider ?? null,
    providerRef: body?.providerRef ?? null,
    paidByName: body?.paidByName ?? null,
    paidByEmail: body?.paidByEmail ?? null,
    notes: body?.notes ?? null,
  });

  return NextResponse.json({ payment: row });
}
