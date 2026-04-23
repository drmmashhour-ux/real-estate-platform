import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateTaxesFromBase, buildReportingPeriodKey } from "@/lib/financial/tax";

export async function createTaxRecordFromCommission(input: {
  ownerType: string;
  ownerId: string;
  transactionRecordId?: string | null;
  relatedType: string;
  relatedId?: string | null;
  taxableBaseCents: number;
  date?: Date;
}) {
  const taxes = calculateTaxesFromBase(input.taxableBaseCents);
  const effectiveDate = input.date ?? new Date();

  return prisma.taxRecord.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      transactionRecordId: input.transactionRecordId ?? null,
      relatedType: input.relatedType,
      relatedId: input.relatedId ?? null,
      taxableBaseCents: input.taxableBaseCents,
      gstCents: taxes.gstCents,
      qstCents: taxes.qstCents,
      totalWithTaxCents: taxes.totalWithTaxCents,
      taxRateGST: taxes.taxRateGST,
      taxRateQST: taxes.taxRateQST,
      reportingPeriodKey: buildReportingPeriodKey(effectiveDate),
    },
  });
}

export async function listTaxRecords(
  ownerType: string,
  ownerId: string,
  filters?: {
    reportingPeriodKey?: string | null;
    reported?: boolean | null;
    transactionType?: string | null;
  },
) {
  const where: Prisma.TaxRecordWhereInput = { ownerType, ownerId };
  if (filters?.reportingPeriodKey?.trim()) {
    where.reportingPeriodKey = filters.reportingPeriodKey.trim();
  }
  if (filters?.reported === true || filters?.reported === false) {
    where.reported = filters.reported;
  }
  if (filters?.transactionType?.trim()) {
    where.transactionRecord = { transactionType: filters.transactionType.trim() };
  }

  return prisma.taxRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { transactionRecord: true },
  });
}
