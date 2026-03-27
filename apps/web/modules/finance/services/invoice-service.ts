import type { Prisma, TenantInvoiceStatus, TenantInvoiceType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { nextTenantInvoiceNumber } from "@/modules/finance/services/invoice-number-service";

export type LineItem = { label: string; quantity: number; unitPrice: number; amount: number };

export function computeInvoiceTotals(lineItems: LineItem[], taxRate?: number | null): {
  subtotal: number;
  taxAmount: number | null;
  totalAmount: number;
} {
  const subtotal = Math.round(lineItems.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const taxAmount =
    taxRate != null && taxRate > 0 ? Math.round(subtotal * taxRate * 100) / 100 : null;
  const totalAmount = Math.round((subtotal + (taxAmount ?? 0)) * 100) / 100;
  return { subtotal, taxAmount, totalAmount };
}

export type CreateInvoiceInput = {
  tenantId: string;
  type: TenantInvoiceType;
  clientName?: string | null;
  clientEmail?: string | null;
  billToData?: Prisma.InputJsonValue | null;
  lineItems: LineItem[];
  taxRate?: number | null;
  currency?: string;
  dueAt?: Date | null;
  listingId?: string | null;
  offerId?: string | null;
  contractId?: string | null;
  brokerClientId?: string | null;
  notes?: string | null;
  createdById?: string | null;
};

export async function createInvoice(input: CreateInvoiceInput) {
  const { subtotal, taxAmount, totalAmount } = computeInvoiceTotals(input.lineItems, input.taxRate);
  const invoiceNumber = await nextTenantInvoiceNumber(input.tenantId);
  return prisma.tenantInvoice.create({
    data: {
      tenantId: input.tenantId,
      invoiceNumber,
      type: input.type,
      status: "DRAFT",
      clientName: input.clientName ?? undefined,
      clientEmail: input.clientEmail ?? undefined,
      billToData: input.billToData === undefined ? undefined : (input.billToData as object),
      lineItems: input.lineItems as unknown as Prisma.InputJsonValue,
      subtotal,
      taxAmount: taxAmount ?? undefined,
      totalAmount,
      currency: input.currency ?? "CAD",
      dueAt: input.dueAt ?? undefined,
      listingId: input.listingId ?? undefined,
      offerId: input.offerId ?? undefined,
      contractId: input.contractId ?? undefined,
      brokerClientId: input.brokerClientId ?? undefined,
      notes: input.notes ?? undefined,
      createdById: input.createdById ?? undefined,
    },
  });
}

export async function markInvoiceIssued(tenantId: string, id: string) {
  return prisma.tenantInvoice.updateMany({
    where: { id, tenantId, status: "DRAFT" },
    data: {
      status: "ISSUED" as TenantInvoiceStatus,
      issuedAt: new Date(),
    },
  });
}

export async function markInvoicePaid(tenantId: string, id: string) {
  return prisma.tenantInvoice.updateMany({
    where: { id, tenantId },
    data: {
      status: "PAID" as TenantInvoiceStatus,
      paidAt: new Date(),
    },
  });
}

export async function cancelInvoice(tenantId: string, id: string) {
  return prisma.tenantInvoice.updateMany({
    where: { id, tenantId },
    data: { status: "CANCELLED" as TenantInvoiceStatus },
  });
}
