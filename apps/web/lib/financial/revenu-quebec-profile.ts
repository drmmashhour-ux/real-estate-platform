import { prisma } from "@/lib/db";

export function maskValue(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const visible = value.replace(/\s/g, "").slice(-4);
  return `****${visible}`;
}

export async function upsertRevenuQuebecProfile(input: {
  ownerType: string;
  ownerId: string;
  legalName?: string | null;
  businessDirectorName?: string | null;
  gstAccountNumber?: string | null;
  qstFileNumber?: string | null;
  neq?: string | null;
  reportingFrequency?: string | null;
  firstPeriodStart?: Date | null;
  firstPeriodEnd?: Date | null;
  firstReturnDueAt?: Date | null;
  sourceDocumentName?: string | null;
  sourceDocumentStored?: boolean;
}) {
  return prisma.revenuQuebecProfile.upsert({
    where: {
      ownerType_ownerId: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
      },
    },
    update: {
      legalName: input.legalName ?? undefined,
      businessDirectorName: input.businessDirectorName ?? undefined,
      neq: input.neq ?? undefined,
      reportingFrequency: input.reportingFrequency ?? undefined,
      firstPeriodStart: input.firstPeriodStart ?? undefined,
      firstPeriodEnd: input.firstPeriodEnd ?? undefined,
      firstReturnDueAt: input.firstReturnDueAt ?? undefined,
      sourceDocumentName: input.sourceDocumentName ?? undefined,
      sourceDocumentStored: input.sourceDocumentStored ?? undefined,
      ...(input.gstAccountNumber !== undefined ?
        {
          gstAccountNumber: input.gstAccountNumber,
          gstAccountNumberMasked: maskValue(input.gstAccountNumber),
        }
      : {}),
      ...(input.qstFileNumber !== undefined ?
        {
          qstFileNumber: input.qstFileNumber,
          qstFileNumberMasked: maskValue(input.qstFileNumber),
        }
      : {}),
    },
    create: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      legalName: input.legalName ?? null,
      businessDirectorName: input.businessDirectorName ?? null,
      gstAccountNumber: input.gstAccountNumber ?? null,
      qstFileNumber: input.qstFileNumber ?? null,
      neq: input.neq ?? null,
      gstAccountNumberMasked: maskValue(input.gstAccountNumber),
      qstFileNumberMasked: maskValue(input.qstFileNumber),
      reportingFrequency: input.reportingFrequency ?? null,
      firstPeriodStart: input.firstPeriodStart ?? null,
      firstPeriodEnd: input.firstPeriodEnd ?? null,
      firstReturnDueAt: input.firstReturnDueAt ?? null,
      sourceDocumentName: input.sourceDocumentName ?? null,
      sourceDocumentStored: input.sourceDocumentStored ?? false,
    },
  });
}

/** Strip raw identifiers for broker-facing JSON (dashboard / API). */
export function sanitizeRevenuQuebecProfileForBrokerUI<T extends { gstAccountNumber?: string | null; qstFileNumber?: string | null }>(
  profile: T | null,
): (Omit<T, "gstAccountNumber" | "qstFileNumber"> & { gstAccountNumber: null; qstFileNumber: null }) | null {
  if (!profile) return null;
  return {
    ...profile,
    gstAccountNumber: null,
    qstFileNumber: null,
  };
}
