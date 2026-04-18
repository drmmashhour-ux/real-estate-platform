import { prisma } from "@/lib/db";
import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanViewOfficeFinance } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request, p: { params: Promise<{ id: string }> }) {
  const ctx = await resolveBrokerOfficeRequest(request, "brokerageBillingV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanViewOfficeFinance(ctx.access.membership.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await p.params;

  const invoice = await prisma.officeInvoice.findFirst({
    where: { id, officeId: ctx.officeId },
    include: { lines: true },
  });
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ invoice });
}
