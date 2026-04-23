import { prisma } from "@/lib/db";
import { generateContractNumber } from "@/lib/compliance/contract-number";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export type AllocateContractNumberParams = {
  contractType: string;
  createdById: string;
  listingId?: string | null;
  dealId?: string | null;
  contractId?: string | null;
  /** When client already holds a registry number from a prior step. */
  existingNumber?: string | null;
};

/**
 * Returns a unique registry number and persists `ContractRegistry`.
 * Optionally stamps `contracts.contract_number` when `contractId` resolves.
 */
export async function ensureContractRegistryNumber(params: AllocateContractNumberParams): Promise<string> {
  const existing = params.existingNumber?.trim();
  if (existing) {
    const row = await prisma.contractRegistry.findUnique({ where: { contractNumber: existing } });
    if (row) return existing;
    throw new Error("UNKNOWN_CONTRACT_NUMBER");
  }

  if (params.contractId?.trim()) {
    const c = await prisma.contract.findUnique({
      where: { id: params.contractId.trim() },
      select: { contractNumber: true },
    });
    const stamped = c?.contractNumber?.trim();
    if (stamped) {
      const reg = await prisma.contractRegistry.findUnique({ where: { contractNumber: stamped } });
      if (reg) return stamped;
    }
  }

  for (let attempt = 0; attempt < 16; attempt++) {
    const contractNumber = generateContractNumber(params.contractType);
    const exists = await prisma.contractRegistry.findUnique({ where: { contractNumber } });
    if (exists) continue;

    await prisma.contractRegistry.create({
      data: {
        contractNumber,
        contractType: params.contractType.slice(0, 64),
        listingId: params.listingId?.trim() || undefined,
        dealId: params.dealId?.trim() || undefined,
        contractId: params.contractId?.trim() || undefined,
        createdBy: params.createdById,
      },
    });

    if (params.contractId?.trim()) {
      await prisma.contract
        .updateMany({
          where: { id: params.contractId.trim(), contractNumber: null },
          data: { contractNumber },
        })
        .catch(() => undefined);
    }

    await recordAuditEvent({
      actorUserId: params.createdById,
      action: "CONTRACT_REGISTRY_NUMBER_ISSUED",
      payload: {
        contractNumber,
        contractType: params.contractType,
        listingId: params.listingId ?? null,
        dealId: params.dealId ?? null,
      },
    });

    return contractNumber;
  }

  throw new Error("CONTRACT_NUMBER_ALLOCATION_FAILED");
}
