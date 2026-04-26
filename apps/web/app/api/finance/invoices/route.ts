import { NextRequest, NextResponse } from "next/server";
import type { TenantInvoiceType } from "@prisma/client";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireTenantContext } from "@/modules/tenancy/services/tenant-context-service";
import { createInvoice, type LineItem } from "@/modules/finance/services/invoice-service";
import { canIssueInvoice, canViewFinance } from "@/modules/finance/services/finance-permissions";
import type { TenantSubject } from "@/modules/tenancy/services/tenant-permissions";

export const dynamic = "force-dynamic";

const TYPES = new Set<TenantInvoiceType>(["COMMISSION", "SERVICE_FEE", "BROKER_FEE", "PLATFORM_FEE", "OTHER"]);

export async function GET(request: NextRequest) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canViewFinance(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const invoices = await prisma.tenantInvoice.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ invoices });
}

export async function POST(request: NextRequest) {
  const r = await requireTenantContext(request);
  if (r instanceof NextResponse) return r;
  const { ctx } = r;
  const subject: TenantSubject = { platformRole: ctx.platformRole, membership: ctx.membership };
  if (!canIssueInvoice(subject, ctx.tenant)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type as TenantInvoiceType | undefined;
  const lineItems = body?.lineItems as LineItem[] | undefined;
  if (!type || !TYPES.has(type) || !Array.isArray(lineItems) || lineItems.length === 0) {
    return NextResponse.json({ error: "type and lineItems required" }, { status: 400 });
  }

  try {
    const inv = await createInvoice({
      tenantId: ctx.tenantId,
      type,
      lineItems,
      taxRate: typeof body?.taxRate === "number" ? body.taxRate : null,
      clientName: body?.clientName ?? null,
      clientEmail: body?.clientEmail ?? null,
      currency: typeof body?.currency === "string" ? body.currency : undefined,
      dueAt: body?.dueAt ? new Date(body.dueAt) : null,
      listingId: body?.listingId ?? null,
      offerId: body?.offerId ?? null,
      contractId: body?.contractId ?? null,
      brokerClientId: body?.brokerClientId ?? null,
      notes: body?.notes ?? null,
      createdById: ctx.userId,
    });
    return NextResponse.json({ invoice: inv });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
