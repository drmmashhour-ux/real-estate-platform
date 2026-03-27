import type { CommissionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateCommissionSplits } from "@/modules/finance/utils/commission-calculations";

export type SplitRowInput = {
  userId?: string | null;
  roleLabel?: string | null;
  percent?: number | null;
  amount?: number | null;
};

export async function createCommissionSplits(params: {
  tenantId: string;
  dealFinancialId: string;
  splits: SplitRowInput[];
  gross: number;
  mode: "percent" | "amount";
}): Promise<void> {
  validateCommissionSplits(params.gross, params.splits, params.mode);
  await prisma.$transaction(async (tx) => {
    await tx.commissionSplit.deleteMany({
      where: { tenantId: params.tenantId, dealFinancialId: params.dealFinancialId },
    });
    for (const s of params.splits) {
      await tx.commissionSplit.create({
        data: {
          tenantId: params.tenantId,
          dealFinancialId: params.dealFinancialId,
          userId: s.userId ?? undefined,
          roleLabel: s.roleLabel ?? undefined,
          percent: s.percent ?? undefined,
          amount:
            s.amount ??
            (params.mode === "percent" && s.percent != null
              ? Math.round(params.gross * (s.percent / 100) * 100) / 100
              : undefined),
          status: "PENDING",
        },
      });
    }
  });
}

export async function approveCommissionSplit(
  tenantId: string,
  splitId: string
): Promise<void> {
  await prisma.commissionSplit.updateMany({
    where: { id: splitId, tenantId },
    data: { status: "APPROVED" as CommissionStatus },
  });
}

export async function markCommissionSplitPaid(
  tenantId: string,
  splitId: string
): Promise<void> {
  await prisma.commissionSplit.updateMany({
    where: { id: splitId, tenantId },
    data: { status: "PAID" as CommissionStatus },
  });
}

export async function listSplitsForDeal(
  tenantId: string,
  dealFinancialId: string
): Promise<Prisma.CommissionSplitGetPayload<object>[]> {
  return prisma.commissionSplit.findMany({
    where: { tenantId, dealFinancialId },
    orderBy: { createdAt: "asc" },
  });
}
