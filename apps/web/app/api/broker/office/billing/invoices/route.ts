import type { OfficeInvoiceLineType, OfficeInvoiceType } from "@prisma/client";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanViewOfficeFinance } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { listInvoicesForOffice } from "@/modules/brokerage-billing/billing.service";
import { createDraftInvoice } from "@/modules/brokerage-billing/invoice.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerageBillingV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanViewOfficeFinance(ctx.access.membership.role)) {
    return Response.json({ error: "Office finance visibility required" }, { status: 403 });
  }

  const invoices = await listInvoicesForOffice(ctx.officeId);
  return Response.json({ invoices });
}

export async function POST(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerageBillingV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanViewOfficeFinance(ctx.access.membership.role)) {
    return Response.json({ error: "Office finance visibility required" }, { status: 403 });
  }

  let body: {
    invoiceType?: OfficeInvoiceType;
    brokerUserId?: string | null;
    dealId?: string | null;
    lines?: Array<{
      lineType: OfficeInvoiceLineType;
      description: string;
      quantity: number;
      unitAmountCents: number;
      totalAmountCents: number;
    }>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.invoiceType || !body.lines?.length) {
    return Response.json({ error: "invoiceType and lines required" }, { status: 400 });
  }

  const result = await createDraftInvoice({
    officeId: ctx.officeId,
    actorUserId: ctx.session.userId,
    invoiceType: body.invoiceType,
    brokerUserId: body.brokerUserId,
    dealId: body.dealId,
    lines: body.lines,
  });
  return Response.json(result);
}
