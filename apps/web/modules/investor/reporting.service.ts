import { prisma } from "@/lib/db";

export interface PipelineStats {
  totalInvestors: number;
  totalTargetAmountCents: number;
  totalActualAmountCents: number;
  byStage: Record<string, number>;
  conversionRate: number; // Percentage of CLOSED / TOTAL
}

/**
 * Reporting Service for Investor Fundraising.
 */
export async function getFundraisingStats(): Promise<PipelineStats> {
  // @ts-ignore - Investor model might not be in generated client
  const allInvestors = await prisma.investor.findMany({
    select: {
      stage: true,
      targetAmount: true,
      actualAmount: true,
    },
  });

  const stats: PipelineStats = {
    totalInvestors: allInvestors.length,
    totalTargetAmountCents: 0,
    totalActualAmountCents: 0,
    byStage: {
      NEW: 0,
      CONTACTED: 0,
      INTERESTED: 0,
      NEGOTIATING: 0,
      CLOSED: 0,
    },
    conversionRate: 0,
  };

  allInvestors.forEach((inv: any) => {
    stats.totalTargetAmountCents += inv.targetAmount || 0;
    stats.totalActualAmountCents += inv.actualAmount || 0;
    stats.byStage[inv.stage] = (stats.byStage[inv.stage] || 0) + 1;
  });

  if (stats.totalInvestors > 0) {
    stats.conversionRate = (stats.byStage["CLOSED"] / stats.totalInvestors) * 100;
  }

  return stats;
}
