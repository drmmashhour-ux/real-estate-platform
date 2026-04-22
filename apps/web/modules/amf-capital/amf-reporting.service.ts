import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[amf-reporting]";

export async function recordDistribution(input: {
  capitalDealId: string;
  investorId?: string | null;
  kind: string;
  amount: number;
  recordedAt?: Date;
  notes?: string | null;
}) {
  const row = await prisma.amfDistributionRecord.create({
    data: {
      capitalDealId: input.capitalDealId,
      investorId: input.investorId ?? undefined,
      kind: input.kind.slice(0, 40),
      amount: input.amount,
      recordedAt: input.recordedAt ?? new Date(),
      notes: input.notes ?? undefined,
    },
  });
  logInfo(TAG, { action: "distribution", id: row.id });
  return row;
}

export async function getDealReportingSnapshot(capitalDealId: string) {
  const [distributions, investments] = await Promise.all([
    prisma.amfDistributionRecord.findMany({
      where: { capitalDealId },
      orderBy: { recordedAt: "desc" },
      include: { investor: { select: { id: true, legalName: true, email: true } } },
    }),
    prisma.amfInvestment.findMany({
      where: { capitalDealId, status: "CONFIRMED" },
      include: { investor: { select: { id: true, legalName: true, email: true } } },
    }),
  ]);

  const totalDistributed = distributions.reduce((s, d) => s + d.amount, 0);
  const totalCommitted = investments.reduce((s, i) => s + i.amount, 0);

  const byInvestor: Record<string, { committed: number; received: number }> = {};
  for (const inv of investments) {
    byInvestor[inv.investorId] = { committed: inv.amount, received: 0 };
  }
  for (const d of distributions) {
    if (d.investorId && byInvestor[d.investorId]) {
      byInvestor[d.investorId].received += d.amount;
    }
  }

  return {
    capitalDealId,
    totalCommitted,
    totalDistributed,
    distributionCount: distributions.length,
    distributions,
    investments,
    perInvestor: byInvestor,
  };
}
