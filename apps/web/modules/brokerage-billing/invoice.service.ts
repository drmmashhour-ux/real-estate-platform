import { prisma } from "@/lib/db";
import { brokerageOfficeAuditKeys, logBrokerageOfficeAudit } from "@/lib/brokerage/office-audit";
import type { CreateOfficeInvoiceInput } from "./brokerage-billing.types";
import { billingDisclaimer } from "./billing-explainer";

export async function createDraftInvoice(input: CreateOfficeInvoiceInput & { actorUserId: string }) {
  const subtotal = input.lines.reduce((s, l) => s + l.totalAmountCents, 0);
  const inv = await prisma.officeInvoice.create({
    data: {
      officeId: input.officeId,
      brokerUserId: input.brokerUserId ?? undefined,
      dealId: input.dealId ?? undefined,
      invoiceType: input.invoiceType,
      status: "draft",
      subtotalCents: subtotal,
      totalCents: subtotal,
      taxes: {},
      lines: {
        create: input.lines.map((l) => ({
          lineType: l.lineType,
          description: l.description,
          quantity: l.quantity,
          unitAmountCents: l.unitAmountCents,
          totalAmountCents: l.totalAmountCents,
        })),
      },
    },
    include: { lines: true },
  });
  return { invoice: inv, disclaimer: billingDisclaimer() };
}

export async function issueInvoice(invoiceId: string, officeId: string, actorUserId: string) {
  const inv = await prisma.officeInvoice.update({
    where: { id: invoiceId, officeId },
    data: {
      status: "issued",
      issuedAt: new Date(),
      issuedByUserId: actorUserId,
    },
  });
  await logBrokerageOfficeAudit({
    officeId,
    actorUserId,
    actionKey: brokerageOfficeAuditKeys.invoiceIssued,
    payload: { invoiceId },
  });
  return inv;
}

export async function markInvoicePaid(invoiceId: string, officeId: string, actorUserId: string) {
  const inv = await prisma.officeInvoice.update({
    where: { id: invoiceId, officeId },
    data: {
      status: "paid",
      paidAt: new Date(),
      markedPaidByUserId: actorUserId,
    },
  });
  await logBrokerageOfficeAudit({
    officeId,
    actorUserId,
    actionKey: brokerageOfficeAuditKeys.invoicePaid,
    payload: { invoiceId },
  });
  return inv;
}
