import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateGrossCommission, calculateNetCommission } from "@/modules/finance/utils/commission-calculations";

export type CreateOrUpdateDealFinancialInput = {
  tenantId: string;
  id?: string;
  listingId?: string | null;
  offerId?: string | null;
  contractId?: string | null;
  salePrice?: number | null;
  commissionRate?: number | null;
  notes?: string | null;
  currency?: string;
};

export async function createOrUpdateDealFinancial(
  input: CreateOrUpdateDealFinancialInput
): Promise<{ id: string }> {
  const currency = input.currency ?? "CAD";
  let gross: number | null = null;
  let net: number | null = null;
  if (input.salePrice != null && input.commissionRate != null) {
    gross = calculateGrossCommission(input.salePrice, input.commissionRate);
    net = calculateNetCommission(gross, 0);
  }

  const data: Prisma.DealFinancialUncheckedCreateInput = {
    tenantId: input.tenantId,
    listingId: input.listingId ?? undefined,
    offerId: input.offerId ?? undefined,
    contractId: input.contractId ?? undefined,
    salePrice: input.salePrice ?? undefined,
    commissionRate: input.commissionRate ?? undefined,
    grossCommission: gross ?? undefined,
    netCommission: net ?? undefined,
    currency,
    notes: input.notes ?? undefined,
  };

  if (input.id) {
    const res = await prisma.dealFinancial.updateMany({
      where: { id: input.id, tenantId: input.tenantId },
      data: {
        listingId: input.listingId ?? null,
        offerId: input.offerId ?? null,
        contractId: input.contractId ?? null,
        salePrice: input.salePrice ?? null,
        commissionRate: input.commissionRate ?? null,
        grossCommission: gross ?? null,
        netCommission: net ?? null,
        currency,
        notes: input.notes ?? null,
      },
    });
    if (res.count === 0) throw new Error("deal_financial_not_found");
    return { id: input.id };
  }

  const row = await prisma.dealFinancial.create({
    data,
  });
  return { id: row.id };
}

export async function getDealFinancialForTenant(
  tenantId: string,
  id: string
): Promise<Prisma.DealFinancialGetPayload<object> | null> {
  return prisma.dealFinancial.findFirst({ where: { id, tenantId } });
}
