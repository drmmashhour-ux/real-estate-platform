import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createTransactionRecord(input: {
  ownerType: string;
  ownerId: string;
  listingId?: string | null;
  dealId?: string | null;
  contractId?: string | null;
  contractNumber?: string | null;
  transactionType: string;
  transactionStatus: string;
  buyerName?: string | null;
  sellerName?: string | null;
  grossPriceCents?: number | null;
  commissionBaseCents?: number | null;
  commissionTotalCents?: number | null;
  brokerAmountCents?: number | null;
  agencyAmountCents?: number | null;
  platformAmountCents?: number | null;
  closingDate?: Date | null;
  notes?: string | null;
  createdById?: string | null;
}) {
  return prisma.transactionRecord.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      listingId: input.listingId ?? null,
      dealId: input.dealId ?? null,
      contractId: input.contractId ?? null,
      contractNumber: input.contractNumber ?? null,
      transactionType: input.transactionType,
      transactionStatus: input.transactionStatus,
      buyerName: input.buyerName ?? null,
      sellerName: input.sellerName ?? null,
      grossPriceCents: input.grossPriceCents ?? null,
      commissionBaseCents: input.commissionBaseCents ?? null,
      commissionTotalCents: input.commissionTotalCents ?? null,
      brokerAmountCents: input.brokerAmountCents ?? null,
      agencyAmountCents: input.agencyAmountCents ?? null,
      platformAmountCents: input.platformAmountCents ?? null,
      closingDate: input.closingDate ?? null,
      notes: input.notes ?? null,
      createdById: input.createdById ?? null,
    },
  });
}

export async function listTransactionRecords(
  ownerType: string,
  ownerId: string,
  filters?: { transactionType?: string | null },
) {
  const where: Prisma.TransactionRecordWhereInput = { ownerType, ownerId };
  if (filters?.transactionType?.trim()) {
    where.transactionType = filters.transactionType.trim();
  }
  return prisma.transactionRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}
