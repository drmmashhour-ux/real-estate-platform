import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/audit/activity-log";

/**
 * PHASE 4: PERFORMANCE ENGINE
 * Computes and tracks the financial performance of an investment fund.
 */
export class FundPerformanceService {
  /**
   * Computes current performance metrics and records a snapshot.
   */
  static async computeFundPerformance(fundId: string, actorUserId: string = "system") {
    const fund = await prisma.investmentFund.findUnique({
      where: { id: fundId },
      include: {
        allocations: {
          include: { deal: true }
        }
      },
    });

    if (!fund) throw new Error("Fund not found.");

    // 1. Compute values
    let totalAllocatedValue = 0;
    let realizedPerformance = 0;
    let unrealizedPerformance = 0;

    for (const allocation of fund.allocations) {
      const amt = allocation.allocatedAmount.toNumber();
      totalAllocatedValue += amt;

      // Simulation logic: closed deals realize ROI, active deals show unrealized growth
      if (allocation.deal.status === "CLOSED") {
        // Assume 8% realized ROI for closed deals in simulation
        realizedPerformance += amt * 0.08;
      } else {
        // Assume 5% unrealized growth for active deals in simulation
        unrealizedPerformance += amt * 0.05;
      }
    }

    const totalValue = fund.totalCapital.toNumber() + realizedPerformance + unrealizedPerformance;

    // 2. Diversification Score (0-1)
    // Formula: ln(n) / ln(10) where n is number of deals, capped at 1.0
    const dealCount = fund.allocations.length;
    const diversificationScore = Math.min(1.0, dealCount > 1 ? Math.log(dealCount) / Math.log(10) : 0.2);

    // 3. Risk Score (0-1)
    // Heuristic: Higher concentration = higher risk
    const riskScore = Math.max(0, 1 - diversificationScore * 0.8);

    // 4. Store Snapshot
    const snapshot = await prisma.fundPerformanceSnapshot.create({
      data: {
        fundId,
        totalValue: new Prisma.Decimal(totalValue),
        allocatedValue: new Prisma.Decimal(totalAllocatedValue),
        unrealizedPerformance,
        realizedPerformance,
        diversificationScore,
        riskScore,
      },
    });

    const actorId = actorUserId === "system" ? null : actorUserId;

    // 5. Log Activity
    await logActivity({
      userId: actorId,
      action: "fund_performance_snapshot_created",
      entityType: "InvestmentFund",
      entityId: fundId,
      metadata: {
        totalValue,
        realized: realizedPerformance,
        unrealized: unrealizedPerformance,
      },
    });

    // 6. Record Evolution Outcome (Phase 6)
    try {
      const { recordEvolutionOutcome } = await import("../evolution/outcome-tracker.service");
      await recordEvolutionOutcome({
        domain: "FUND",
        strategyKey: "capital_allocation",
        entityId: fundId,
        metricType: "STRATEGY",
        actualJson: {
          performance: realizedPerformance + unrealizedPerformance,
          diversificationScore,
          riskScore,
          totalValue,
        }
      });
    } catch (e) {
      console.warn("Failed to record evolution outcome for fund:", e);
    }

    return snapshot;
  }
}
