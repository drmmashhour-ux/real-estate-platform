import type { LecipmLedgerEntryKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logPaymentOpsEvent } from "./payments-ops-audit.service";

export async function appendLedgerEntry(input: {
  dealId: string;
  paymentId?: string | null;
  entryKind: LecipmLedgerEntryKind;
  amountCents: number;
  currency?: string;
  description: string;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
  auditActionKey?: string;
}) {
  const row = await prisma.lecipmPaymentLedgerEntry.create({
    data: {
      dealId: input.dealId,
      paymentId: input.paymentId ?? null,
      entryKind: input.entryKind,
      amountCents: input.amountCents,
      currency: input.currency ?? "cad",
      description: input.description,
      metadata: (input.metadata ?? {}) as object,
    },
  });
  await logPaymentOpsEvent(
    input.dealId,
    input.auditActionKey ?? `ledger_${input.entryKind}`,
    { ledgerEntryId: row.id, paymentId: input.paymentId },
    input.actorUserId,
  );
  return row;
}

export async function listLedgerForDeal(dealId: string) {
  return prisma.lecipmPaymentLedgerEntry.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });
}
