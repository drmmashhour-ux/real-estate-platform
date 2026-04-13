import type { DealFinancingCoordinationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logCoordinationAudit } from "@/lib/deals/coordination-audit";
import type { LenderMetadataV1 } from "./bank-coordination.types";

export async function getBankCoordination(dealId: string) {
  const [row, contacts] = await Promise.all([
    prisma.dealBankCoordination.findUnique({ where: { dealId } }),
    prisma.coordinationContact.findMany({
      where: { dealId, contactType: "LENDER" },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  return { coordination: row, lenderContacts: contacts };
}

export async function patchBankCoordination(
  dealId: string,
  input: {
    financingStatus?: DealFinancingCoordinationStatus;
    institutionName?: string | null;
    lastContactAt?: Date | null;
    lenderMetadata?: LenderMetadataV1;
    missingInfoFlags?: string[];
  },
  actorUserId: string
) {
  const prev = await prisma.dealBankCoordination.findUnique({ where: { dealId } });
  const row = await prisma.dealBankCoordination.upsert({
    where: { dealId },
    create: {
      dealId,
      financingStatus: input.financingStatus ?? "NOT_STARTED",
      institutionName: input.institutionName ?? undefined,
      lastContactAt: input.lastContactAt ?? undefined,
      lenderMetadata: (input.lenderMetadata ?? {}) as object,
      missingInfoFlags: (input.missingInfoFlags ?? []) as Prisma.InputJsonValue,
    },
    update: {
      financingStatus: input.financingStatus ?? undefined,
      institutionName: input.institutionName ?? undefined,
      lastContactAt: input.lastContactAt ?? undefined,
      lenderMetadata:
        input.lenderMetadata !== undefined ? (input.lenderMetadata as Prisma.InputJsonValue) : undefined,
      missingInfoFlags:
        input.missingInfoFlags !== undefined ? (input.missingInfoFlags as Prisma.InputJsonValue) : undefined,
    },
  });
  if (input.financingStatus && input.financingStatus !== prev?.financingStatus) {
    await logCoordinationAudit({
      dealId,
      action: "lender_status_changed",
      actorUserId,
      entityType: "DealBankCoordination",
      entityId: row.id,
      payload: { from: prev?.financingStatus ?? null, to: input.financingStatus },
    });
  }
  return row;
}
