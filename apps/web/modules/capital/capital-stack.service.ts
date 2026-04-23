import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";

const TAG = "[capital.stack]";

export async function getCapitalStack(dealId: string) {
  return prisma.lecipmPipelineDealCapitalStack.findUnique({ where: { dealId } });
}

export async function createCapitalStack(
  dealId: string,
  data: {
    totalPurchasePrice: number;
    equityAmount?: number | null;
    debtAmount?: number | null;
    noiAnnual?: number | null;
    annualDebtService?: number | null;
  },
  actorUserId: string | null
) {
  const existing = await prisma.lecipmPipelineDealCapitalStack.findUnique({ where: { dealId } });
  if (existing) throw new Error("Capital stack already exists for this deal");

  const debt = data.debtAmount ?? null;
  const price = data.totalPurchasePrice;
  const ltv = debt != null && price > 0 ? (debt / price) * 100 : null;
  const dscr = calculateDscrRaw(data.noiAnnual ?? null, data.annualDebtService ?? null);

  const row = await prisma.lecipmPipelineDealCapitalStack.create({
    data: {
      dealId,
      totalPurchasePrice: price,
      equityAmount: data.equityAmount ?? undefined,
      debtAmount: debt ?? undefined,
      loanToValue: ltv ?? undefined,
      debtServiceCoverage: dscr ?? undefined,
      noiAnnual: data.noiAnnual ?? undefined,
      annualDebtService: data.annualDebtService ?? undefined,
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CAPITAL_STACK_CREATED",
    actorUserId,
    summary: `Capital stack created (purchase ${price})`,
    metadataJson: { capitalStackId: row.id },
  });

  logInfo(TAG, { dealId, id: row.id });
  return row;
}

export async function updateCapitalStack(
  dealId: string,
  data: Partial<{
    totalPurchasePrice: number;
    equityAmount: number | null;
    debtAmount: number | null;
    noiAnnual: number | null;
    annualDebtService: number | null;
  }>,
  actorUserId: string | null
) {
  const prev = await prisma.lecipmPipelineDealCapitalStack.findUnique({ where: { dealId } });
  if (!prev) throw new Error("Capital stack not found");

  const price = data.totalPurchasePrice ?? prev.totalPurchasePrice;
  const debt = data.debtAmount !== undefined ? data.debtAmount : prev.debtAmount;
  const ltv = debt != null && price > 0 ? (debt / price) * 100 : null;
  const noi = data.noiAnnual !== undefined ? data.noiAnnual : prev.noiAnnual;
  const ads = data.annualDebtService !== undefined ? data.annualDebtService : prev.annualDebtService;
  const dscr = calculateDscrRaw(noi ?? null, ads ?? null);

  const row = await prisma.lecipmPipelineDealCapitalStack.update({
    where: { dealId },
    data: {
      ...(data.totalPurchasePrice !== undefined ? { totalPurchasePrice: data.totalPurchasePrice } : {}),
      ...(data.equityAmount !== undefined ? { equityAmount: data.equityAmount ?? undefined } : {}),
      ...(data.debtAmount !== undefined ? { debtAmount: data.debtAmount ?? undefined } : {}),
      ...(data.noiAnnual !== undefined ? { noiAnnual: data.noiAnnual ?? undefined } : {}),
      ...(data.annualDebtService !== undefined ? { annualDebtService: data.annualDebtService ?? undefined } : {}),
      loanToValue: ltv ?? undefined,
      debtServiceCoverage: dscr ?? undefined,
    },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CAPITAL_STACK_UPDATED",
    actorUserId,
    summary: "Capital stack updated",
  });

  return row;
}

export async function upsertCapitalStack(
  dealId: string,
  data: {
    totalPurchasePrice: number;
    equityAmount?: number | null;
    debtAmount?: number | null;
    noiAnnual?: number | null;
    annualDebtService?: number | null;
  },
  actorUserId: string | null
) {
  const existing = await prisma.lecipmPipelineDealCapitalStack.findUnique({ where: { dealId } });
  if (existing) {
    return updateCapitalStack(dealId, data, actorUserId);
  }
  return createCapitalStack(dealId, data, actorUserId);
}

function calculateDscrRaw(noi: number | null, annualDebtService: number | null): number | null {
  if (noi == null || annualDebtService == null || annualDebtService <= 0) return null;
  return noi / annualDebtService;
}

/** LTV = debt / purchase price (%). */
export async function calculateLTV(dealId: string): Promise<number | null> {
  const row = await prisma.lecipmPipelineDealCapitalStack.findUnique({ where: { dealId } });
  if (!row) return null;
  const debt = row.debtAmount;
  if (debt == null || row.totalPurchasePrice <= 0) return null;
  return (debt / row.totalPurchasePrice) * 100;
}

/** DSCR = NOI / annual debt service (when inputs exist). */
export async function calculateDSCR(dealId: string): Promise<number | null> {
  const row = await prisma.lecipmPipelineDealCapitalStack.findUnique({ where: { dealId } });
  if (!row) return null;
  return calculateDscrRaw(row.noiAnnual ?? null, row.annualDebtService ?? null);
}
