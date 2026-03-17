/**
 * Financial Defense – payout risk flags, refund/chargeback defense, loss tracking.
 * Connects payments, payouts, fraud, disputes; finance-sensitive workflows.
 */
import { prisma } from "@/lib/db";

/** Create a financial risk flag (suspicious payout, refund abuse, chargeback risk, anomaly). */
export async function createFinancialRiskFlag(params: {
  entityType: string;
  entityId: string;
  flagType: string;
  severity: string;
  amountCents?: number;
  payload?: object;
  createdBy?: string;
}) {
  return prisma.financialRiskFlag.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      flagType: params.flagType,
      severity: params.severity,
      amountCents: params.amountCents,
      payload: (params.payload as object) ?? undefined,
      createdBy: params.createdBy,
      status: "OPEN",
    },
  });
}

/** Resolve a risk flag (cleared or confirmed). */
export async function resolveFinancialRiskFlag(
  id: string,
  status: "CLEARED" | "CONFIRMED",
  resolvedBy: string
) {
  return prisma.financialRiskFlag.update({
    where: { id },
    data: { status, resolvedAt: new Date(), resolvedBy },
  });
}

/** Get open risk flags for an entity or globally. */
export async function getFinancialRiskFlags(params: {
  entityType?: string;
  entityId?: string;
  flagType?: string;
  status?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};
  if (params.entityType) where.entityType = params.entityType;
  if (params.entityId) where.entityId = params.entityId;
  if (params.flagType) where.flagType = params.flagType;
  if (params.status) where.status = params.status;
  return prisma.financialRiskFlag.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}

/** Check if entity has open high-severity financial risk (for payout release). */
export async function hasOpenFinancialRisk(entityType: string, entityId: string): Promise<boolean> {
  const count = await prisma.financialRiskFlag.count({
    where: {
      entityType,
      entityId,
      status: "OPEN",
      severity: "HIGH",
    },
  });
  return count > 0;
}
