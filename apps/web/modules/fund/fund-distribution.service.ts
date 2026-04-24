import { prisma } from "@/lib/db";
import { Prisma, FundDistributionType } from "@prisma/client";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 5: DISTRIBUTION (SIMULATION ONLY)
 * Simulates the distribution of profits to fund investors.
 */
export class FundDistributionService {
  /**
   * Simulates a distribution run for a specific fund.
   */
  static async simulateDistributions(fundId: string, actorUserId: string = "system") {
    const fund = await prisma.investmentFund.findUnique({
      where: { id: fundId },
      include: {
        investors: true,
        performanceSnapshots: { orderBy: { timestamp: "desc" }, take: 1 }
      },
    });

    if (!fund) throw new Error("Fund not found.");

    // 1. Compute profit pool (directional simulation)
    // Use realized performance from latest snapshot, or fallback to unrealized if positive
    const latestSnapshot = fund.performanceSnapshots[0];
    let profitPool = latestSnapshot?.realizedPerformance || 0;
    
    if (profitPool <= 0 && latestSnapshot?.unrealizedPerformance > 0) {
      // Simulate taking 50% of unrealized growth as distributable profit for simulation purposes
      profitPool = latestSnapshot.unrealizedPerformance * 0.5;
    }

    if (profitPool <= 0) {
      // Final fallback for simulation: 2% of total capital
      profitPool = fund.totalCapital.toNumber() * 0.02;
    }

    const actorId = actorUserId === "system" ? null : actorUserId;

    // 2. Allocate per ownership % and create distributions
    return await prisma.$transaction(async (tx) => {
      const distributions = [];

      for (const investor of fund.investors) {
        const amount = profitPool * investor.ownershipPercent;
        if (amount <= 0) continue;

        const dist = await tx.fundDistribution.create({
          data: {
            fundId,
            investorId: investor.id,
            amount: new Prisma.Decimal(amount),
            type: FundDistributionType.PROFIT,
          },
        });
        distributions.push(dist);
      }

      // 3. Log Activity
      await logActivity({
        userId: actorId,
        action: "fund_distribution_simulated",
        entityType: "InvestmentFund",
        entityId: fundId,
        metadata: {
          profitPool,
          investorCount: distributions.length,
          note: "SIMULATION ONLY - No real money movement."
        },
      });

      return distributions;
    });
  }
}
