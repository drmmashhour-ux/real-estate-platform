import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanViewOfficeFinance } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import { markInvoicePaid } from "@/modules/brokerage-billing/invoice.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, p: { params: Promise<{ id: string }> }) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerageBillingV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanViewOfficeFinance(ctx.access.membership.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await p.params;

  const invoice = await markInvoicePaid(id, ctx.officeId, ctx.session.userId);
  return Response.json({ invoice });
}
