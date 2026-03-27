import type { PaymentRecordStatus, PaymentRecordType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type RecordPaymentInput = {
  tenantId: string;
  type: PaymentRecordType;
  amount: number;
  currency?: string;
  invoiceId?: string | null;
  dealFinancialId?: string | null;
  provider?: string | null;
  providerRef?: string | null;
  paidByName?: string | null;
  paidByEmail?: string | null;
  notes?: string | null;
};

export async function recordPayment(input: RecordPaymentInput) {
  return prisma.paymentRecord.create({
    data: {
      tenantId: input.tenantId,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? "CAD",
      tenantInvoiceId: input.invoiceId ?? undefined,
      dealFinancialId: input.dealFinancialId ?? undefined,
      provider: input.provider ?? undefined,
      providerRef: input.providerRef ?? undefined,
      paidByName: input.paidByName ?? undefined,
      paidByEmail: input.paidByEmail ?? undefined,
      notes: input.notes ?? undefined,
      status: "SUCCEEDED" as PaymentRecordStatus,
    },
  });
}

export async function updatePaymentRecord(
  tenantId: string,
  id: string,
  data: Prisma.PaymentRecordUpdateInput
) {
  const res = await prisma.paymentRecord.updateMany({
    where: { id, tenantId },
    data,
  });
  if (res.count === 0) throw new Error("payment_not_found");
  return prisma.paymentRecord.findFirst({ where: { id, tenantId } });
}
